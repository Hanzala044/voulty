import os
import io
import httpx
from fastapi import FastAPI, Request, Form
from fastapi.responses import Response
from twilio.twiml.messaging_response import MessagingResponse
from supabase import create_client, Client
from openai import OpenAI
from geopy.geocoders import Nominatim
from dotenv import load_dotenv
import uuid

load_dotenv()

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Road Infrastructure Reporter is running!"}

# Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None
    
geolocator = Nominatim(user_agent="road_reporter_app")

async def download_twilio_media(media_url: str) -> bytes:
    """Download media from Twilio using authentication."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            media_url, 
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        )
        response.raise_for_status()
        return response.content

def get_ai_classification(image_url: str) -> str:
    """Use GPT-4o-mini Vision to classify the road issue."""
    if not openai_client:
        return "Uncategorized (OpenAI Key Missing)"
        
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert infrastructure inspector. Classify the given image of road infrastructure damage into exactly ONE of the following categories: 'Surface Distress' (Potholes, cracks), 'Drainage Issues', 'Safety Assets' (guardrails, lights), or 'Signage/Marking'. Respond ONLY with the category name, nothing else."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What type of road issue is this?"},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return "Uncategorized (AI Error)"

@app.post("/api/webhook/twilio")
async def twilio_webhook(request: Request):
    """Handle incoming WhatsApp messages from Twilio."""
    form_data = await request.form()
    
    sender = form_data.get("From", "")
    num_media = int(form_data.get("NumMedia", 0))
    latitude = form_data.get("Latitude")
    longitude = form_data.get("Longitude")
    
    twiml = MessagingResponse()

    # STATE 1: User sent an Image
    if num_media > 0:
        media_url = form_data.get("MediaUrl0")
        media_content_type = form_data.get("MediaContentType0", "image/jpeg")
        
        try:
            # 1. Download image from Twilio
            image_bytes = await download_twilio_media(media_url)
            
            # 2. Upload to Supabase Storage
            ext = "jpg"
            if "png" in media_content_type: ext = "png"
            filename = f"{uuid.uuid4()}.{ext}"
            
            res = supabase.storage.from_("road-reports").upload(
                file=image_bytes,
                path=filename,
                file_options={"content-type": media_content_type}
            )
            
            # Get public URL
            public_url = supabase.storage.from_("road-reports").get_public_url(filename)
            
            # 3. Save initial record in DB
            db_res = supabase.table("infrastructure_reports").insert({
                "sender_phone": sender,
                "image_url": public_url,
                "status": "awaiting_location"
            }).execute()
            
            # 4. Ask user for location
            msg = (
                "🤖 Report Initiated! > Thanks for helping keep our roads safe. I've received your image.\n\n"
                "Because WhatsApp removes location data from photos, please tap the 📎 Attachment icon and share your Current Location so we know exactly where this is! 📍"
            )
            twiml.message(msg)
            
        except Exception as e:
            print(f"Error processing image: {e}")
            twiml.message("Sorry, there was an error processing your image. Please try again.")

    # STATE 2: User sent a Location Pin
    elif latitude and longitude:
        lat, lon = float(latitude), float(longitude)
        
        try:
            # 1. Find the pending report for this user
            reports = supabase.table("infrastructure_reports") \
                .select("*") \
                .eq("sender_phone", sender) \
                .eq("status", "awaiting_location") \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
                
            if not reports.data:
                twiml.message("Please send a photo of the infrastructure issue first!")
                return Response(content=str(twiml), media_type="application/xml")
                
            report = reports.data[0]
            report_id = report["id"]
            image_url = report["image_url"]
            
            # 2. Reverse Geocode to get address
            location = geolocator.reverse((lat, lon), exactly_one=True)
            address = location.address if location else "Unknown Address"
            
            # 3. Classify image using AI
            issue_type = get_ai_classification(image_url)
            
            # 4. Update the record
            supabase.table("infrastructure_reports").update({
                "latitude": lat,
                "longitude": lon,
                "address": address,
                "issue_type": issue_type,
                "status": "pending"
            }).eq("id", report_id).execute()
            
            # 5. Send success message
            short_id = report_id.split('-')[0].upper()
            msg = (
                "✅ Report Successfully Logged!\n\n"
                f"📋 Issue Detected: {issue_type}\n"
                f"📍 Location: {address}\n"
                f"🎫 Ticket ID: #{short_id}\n\n"
                "Our public works team has been notified. We will update you when the status changes to 'Resolved'. Thank you! 🛣️"
            )
            twiml.message(msg)
            
        except Exception as e:
            print(f"Error processing location: {e}")
            twiml.message("Sorry, there was an error analyzing your report. Please try again.")
            
    # OTHER: Fallback
    else:
        twiml.message("Welcome to CityRoadBot! 🛣️\nTo report an issue, please send a photo of the road damage.")

    return Response(content=str(twiml), media_type="application/xml")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
