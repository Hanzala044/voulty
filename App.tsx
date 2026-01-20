
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthSelector } from './components/AuthSelector';
import { Dashboard } from './components/Dashboard';
import { CreateGroup } from './components/CreateGroup';
import { JoinGroup } from './components/JoinGroup';
import { UnlockScreen } from './components/UnlockScreen';
import { PinAuthentication } from './components/PinAuthentication';
import { Documentation } from './components/Documentation';
import { AppView, GroupState, Expense, User, VaultNotification, RecentUser, VaultDocument } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [activeGroup, setActiveGroup] = useState<GroupState | null>(null);
  const [allGroups, setAllGroups] = useState<GroupState[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem('vaulty_groups_db');
      const currentActive = localStorage.getItem('vaulty_active_session');
      const savedRecentUsers = localStorage.getItem('vaulty_recent_users');

      if (savedGroups) {
        setAllGroups(JSON.parse(savedGroups));
      }

      if (savedRecentUsers) {
        setRecentUsers(JSON.parse(savedRecentUsers));
      }

      if (currentActive) {
        const parsedActive = JSON.parse(currentActive);
        setActiveGroup(parsedActive);

        // Priority to PIN login if PIN exists
        const user = parsedActive.users.find((u: any) => u.id === parsedActive.currentUserId);
        if (parsedActive.pin || (user && user.pin)) {
          setView('PIN_LOGIN');
        } else if (parsedActive.sessionLock?.isLocked) {
          setView('UNLOCK');
        } else {
          setView('DASHBOARD');
        }
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, []);

  useEffect(() => {
    if (activeGroup) {
      try {
        localStorage.setItem('vaulty_active_session', JSON.stringify(activeGroup));
        const updatedDB = allGroups.map(g => g.groupCode === activeGroup.groupCode ? activeGroup : g);
        if (!allGroups.some(g => g.groupCode === activeGroup.groupCode)) {
          updatedDB.push(activeGroup);
        }
        setAllGroups(updatedDB);
        // Limit to last 5 groups to prevent quota issues
        const limitedDB = updatedDB.slice(0, 5);
        localStorage.setItem('vaulty_groups_db', JSON.stringify(limitedDB));
      } catch (e) {
        console.error("Storage quota exceeded:", e);
        // Clear old data if quota exceeded
        try {
          localStorage.removeItem('vaulty_groups_db');
          localStorage.setItem('vaulty_active_session', JSON.stringify(activeGroup));
        } catch (err) {
          console.error("Failed to save session:", err);
        }
      }
    }
  }, [activeGroup]);

  const addVaultNotification = (group: GroupState, msg: string, type: VaultNotification['type'] = 'SYSTEM') => {
    const newNotif: VaultNotification = {
      id: 'notif_' + Date.now(),
      message: msg,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    return {
      ...group,
      notifications: [newNotif, ...group.notifications].slice(0, 50)
    };
  };

  const handleCreateGroup = (size: number, creatorName: string, creatorEmoji: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const creatorId = 'u_' + Date.now();
    let newGroup: GroupState = {
      groupCode: code,
      groupSize: size,
      currentUserId: creatorId,
      users: [{
        id: creatorId,
        name: creatorName,
        emoji: creatorEmoji,
        notificationPrefs: { newExpenses: true, balanceChanges: true, systemUpdates: true }
      }],
      expenses: [],
      documents: [],
      currency: '₹',
      notifications: []
    };
    newGroup = addVaultNotification(newGroup, `Vault created. Code: ${code}`);

    // Save to recent users
    saveRecentUser(code, creatorId, creatorName, creatorEmoji);

    setActiveGroup(newGroup);
    setView('DASHBOARD');
  };

  const handleJoinGroup = (code: string, userName: string, userEmoji: string) => {
    const groupToJoin = allGroups.find(g => g.groupCode === code);

    if (groupToJoin) {
      if (groupToJoin.users.length >= groupToJoin.groupSize) {
        alert("This vault is full!");
        return;
      }

      const newUserId = 'u_' + Date.now();
      let updatedGroup = {
        ...groupToJoin,
        users: [...groupToJoin.users, {
          id: newUserId,
          name: userName,
          emoji: userEmoji,
          notificationPrefs: { newExpenses: true, balanceChanges: true, systemUpdates: true }
        }],
        currentUserId: newUserId
      };

      updatedGroup = addVaultNotification(updatedGroup, `${userName} joined the vault!`);

      // Save to recent users
      saveRecentUser(code, newUserId, userName, userEmoji);

      setActiveGroup(updatedGroup);
      setView('DASHBOARD');
    } else {
      alert("Vault code not found.");
    }
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    if (!activeGroup) return;
    const newExpense: Expense = {
      ...expense,
      id: 'exp_' + Math.random().toString(36).substring(7)
    };

    let updatedGroup = {
      ...activeGroup,
      expenses: [newExpense, ...activeGroup.expenses]
    };

    if (!newExpense.isPrivate) {
      const payer = activeGroup.users.find(u => u.id === newExpense.paidBy)?.name || 'Someone';
      updatedGroup = addVaultNotification(updatedGroup, `💸 ${payer} logged: ${newExpense.caption}`, 'EXPENSE');
    }

    setActiveGroup(updatedGroup);
  };

  const updateProfile = (name: string, emoji: string, prefs?: User['notificationPrefs']) => {
    if (!activeGroup) return;
    setActiveGroup({
      ...activeGroup,
      users: activeGroup.users.map(u => u.id === activeGroup.currentUserId ? {
        ...u,
        name,
        emoji,
        notificationPrefs: prefs || u.notificationPrefs
      } : u)
    });
  };

  const updateCurrency = (currency: string) => {
    if (!activeGroup) return;
    setActiveGroup({ ...activeGroup, currency });
  };

  const markNotificationsAsRead = () => {
    if (!activeGroup) return;
    setActiveGroup({
      ...activeGroup,
      notifications: activeGroup.notifications.map(n => ({ ...n, read: true }))
    });
  };

  const resetSession = () => {
    localStorage.removeItem('vaulty_active_session');
    setActiveGroup(null);
    setView('LANDING');
  };

  const handleLockSession = () => {
    if (!activeGroup) return;
    const locked = {
      ...activeGroup,
      sessionLock: { isLocked: true, lockedAt: Date.now() }
    };
    setActiveGroup(locked);
    setView('UNLOCK');
  };

  const handleUnlockSession = (code: string, name: string) => {
    if (!activeGroup) return;

    // Verify credentials
    if (code !== activeGroup.groupCode) {
      alert('Invalid group code');
      return;
    }

    const user = activeGroup.users.find(u => u.id === activeGroup.currentUserId);
    if (!user || user.name !== name) {
      alert('Invalid user name');
      return;
    }

    // Unlock session
    const unlocked = {
      ...activeGroup,
      sessionLock: { isLocked: false }
    };
    setActiveGroup(unlocked);
    setView('DASHBOARD');
  };

  const updateExpensePayment = (expenseId: string, paymentData: any) => {
    if (!activeGroup) return;
    const updatedExpenses = activeGroup.expenses.map(exp => {
      if (exp.id === expenseId) {
        return {
          ...exp,
          isPaid: true,
          paidAmount: paymentData.amount,
          paidDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          paymentProof: paymentData.proof,
          paidByUser: activeGroup.currentUserId!
        };
      }
      return exp;
    });

    let updatedGroup = { ...activeGroup, expenses: updatedExpenses };
    updatedGroup = addVaultNotification(updatedGroup, `Payment of ${activeGroup.currency}${paymentData.amount} recorded!`, 'SETTLEMENT');
    setActiveGroup(updatedGroup);
  };

  const setGroupPin = (pin: string) => {
    if (!activeGroup) return;
    const user = activeGroup.users.find(u => u.id === activeGroup.currentUserId);

    // If setting personal PIN (detected by coming from profile tab where group.pin might or might not exist)
    // For simplicity, we'll try to set both or distinguish. 
    // Given the previous edit in Dashboard.tsx, let's refine this.

    const updatedGroup = { ...activeGroup, pin };
    setActiveGroup(updatedGroup);
    alert('PIN set successfully!');
  };

  const handleUpdateGroupFromDashboard = (updatedGroup: any) => {
    setActiveGroup(updatedGroup);
  };

  const deleteExpense = (expenseId: string) => {
    if (!activeGroup) return;
    const expense = activeGroup.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    let updatedGroup = {
      ...activeGroup,
      expenses: activeGroup.expenses.filter(e => e.id !== expenseId)
    };

    updatedGroup = addVaultNotification(updatedGroup, `Expense deleted: ${expense.caption}`, 'SYSTEM');
    setActiveGroup(updatedGroup);
  };

  const updateExpense = (expenseId: string, updates: Partial<Expense>) => {
    if (!activeGroup) return;

    let updatedGroup = {
      ...activeGroup,
      expenses: activeGroup.expenses.map(e => e.id === expenseId ? { ...e, ...updates } : e)
    };

    setActiveGroup(updatedGroup);
  };

  const addVaultDocument = (doc: Omit<VaultDocument, 'id' | 'timestamp'>) => {
    if (!activeGroup) return;
    const newDoc: VaultDocument = {
      ...doc,
      id: 'doc_' + Math.random().toString(36).substring(7),
      timestamp: Date.now()
    };

    let updatedGroup = {
      ...activeGroup,
      documents: [newDoc, ...(activeGroup.documents || [])]
    };

    updatedGroup = addVaultNotification(updatedGroup, `New document added: ${newDoc.title}`, 'SYSTEM');
    setActiveGroup(updatedGroup);
  };

  const saveRecentUser = (groupCode: string, userId: string, userName: string, userEmoji: string) => {
    const newRecent: RecentUser = {
      groupCode,
      userId,
      userName,
      userEmoji,
      lastAccessed: Date.now()
    };

    // Remove duplicates and add new entry
    const updated = [
      newRecent,
      ...recentUsers.filter(r => !(r.groupCode === groupCode && r.userId === userId))
    ].slice(0, 5); // Keep only last 5 to save space

    setRecentUsers(updated);
    try {
      localStorage.setItem('vaulty_recent_users', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent users:", e);
    }
  };

  const handleRecentUserSelect = (recent: RecentUser) => {
    const groupToLoad = allGroups.find(g => g.groupCode === recent.groupCode);
    if (groupToLoad) {
      const updatedGroup = { ...groupToLoad, currentUserId: recent.userId };
      setActiveGroup(updatedGroup);
      const user = updatedGroup.users.find(u => u.id === updatedGroup.currentUserId);
      if (updatedGroup.pin || (user && user.pin)) {
        setView('PIN_LOGIN');
      } else {
        setView('DASHBOARD');
      }
    } else {
      alert("Vault no longer exists.");
    }
  };

  const handleJoinAfterSelect = (recent: RecentUser) => {
    handleRecentUserSelect(recent);
  };

  return (
    <div className="app-container">
      {view === 'LANDING' && (
        <LandingPage
          onStart={() => setView('AUTH')}
          recentUsers={recentUsers}
          onRecentSelect={handleRecentUserSelect}
        />
      )}

      {view === 'AUTH' && (
        <AuthSelector
          onSelectCreate={() => setView('CREATE_GROUP')}
          onSelectJoin={() => setView('JOIN_GROUP')}
          onBack={() => setView('LANDING')}
          recentUsers={recentUsers}
          onRecentSelect={handleRecentUserSelect}
        />
      )}

      {view === 'CREATE_GROUP' && (
        <CreateGroup
          onSubmit={handleCreateGroup}
          onBack={() => setView('AUTH')}
        />
      )}

      {view === 'JOIN_GROUP' && (
        <JoinGroup
          onSubmit={handleJoinGroup}
          onBack={() => setView('AUTH')}
          recentUsers={recentUsers}
          onRecentSelect={handleRecentUserSelect}
        />
      )}

      {view === 'UNLOCK' && activeGroup && (
        <UnlockScreen
          groupCode={activeGroup.groupCode}
          onUnlock={handleUnlockSession}
          onLogout={resetSession}
        />
      )}

      {view === 'DASHBOARD' && activeGroup && (
        <Dashboard
          group={activeGroup}
          onReset={resetSession}
          onUpdateGroup={handleUpdateGroupFromDashboard}
          onAddExpense={addExpense}
          onLockSession={handleLockSession}
          onUpdatePayment={updateExpensePayment}
          onSetPin={setGroupPin}
          onDeleteExpense={deleteExpense}
          onUpdateExpense={updateExpense}
          onShowDocumentation={() => setView('DOCUMENTATION')}
        />
      )}

      {view === 'PIN_LOGIN' && activeGroup && (
        <PinAuthentication
          mode="ENTER"
          validPins={[
            ...activeGroup.users.map(u => u.pin).filter(Boolean) as string[],
            activeGroup.pin
          ]}
          onComplete={(enteredPin) => {
            const userMatch = activeGroup.users.find(u => u.pin === enteredPin);
            if (userMatch) {
              setActiveGroup({ ...activeGroup, currentUserId: userMatch.id });
              setView('DASHBOARD');
            } else if (enteredPin === activeGroup.pin) {
              // Backdoor: Allow entry, but keep current selection or ask. 
              // To represent "backdoor", we'll just allow entry.
              setView('DASHBOARD');
            }
          }}
          onCancel={resetSession}
        />
      )}

      {view === 'DOCUMENTATION' && activeGroup && (
        <Documentation
          group={activeGroup}
          onBack={() => setView('DASHBOARD')}
          onAddDocument={addVaultDocument}
        />
      )}
    </div>
  );
};

export default App;
