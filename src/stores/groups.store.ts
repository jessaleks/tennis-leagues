import { createSignal } from "solid-js";
import {
  createGroup as firebaseCreateGroup,
  joinGroup as firebaseJoinGroup,
  getUserGroups as firebaseGetUserGroups,
  getGroup as firebaseGetGroup,
  getGroupMembers as firebaseGetGroupMembers,
  removeMember as firebaseRemoveMember,
  leaveGroup as firebaseLeaveGroup,
  updateMemberStats as firebaseUpdateMemberStats,
  getGroupErrorMessage,
  validateCreateGroupInput,
  validateJoinGroupInput,
  type Group,
  type GroupMember,
} from "../services/groups";

// ============================================================================
// State Signals
// ============================================================================

const [groups, setGroups] = createSignal<Group[]>([]);
const [currentGroup, setCurrentGroup] = createSignal<Group | null>(null);
const [currentGroupMembers, setCurrentGroupMembers] = createSignal<GroupMember[]>([]);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

function clearError(): void {
  setError(null);
}

function handleError(err: unknown): void {
  const message = getGroupErrorMessage(err);
  setError(message);
  throw err;
}

// ============================================================================
// Group Actions
// ============================================================================

/**
 * Creates a new group
 */
async function createGroup(name: string, adminId: string): Promise<Group> {
  setError(null);
  setLoading(true);
  
  try {
    // Validate input
    const input = validateCreateGroupInput({ name, adminId });
    
    // Create group via Firebase
    const group = await firebaseCreateGroup(input.name, input.adminId);
    
    // Update local state
    setGroups((prev) => [...prev, group]);
    
    return group;
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Joins a group using an invite code
 */
async function joinGroup(inviteCode: string, userId: string): Promise<Group> {
  setError(null);
  setLoading(true);
  
  try {
    // Validate input
    const input = validateJoinGroupInput({ 
      inviteCode: inviteCode.toUpperCase(), 
      userId 
    });
    
    // Join group via Firebase
    const group = await firebaseJoinGroup(input.inviteCode, input.userId);
    
    // Update local state
    setGroups((prev) => {
      // Check if group already exists in list
      const exists = prev.some((g) => g.id === group.id);
      if (exists) {
        return prev.map((g) => (g.id === group.id ? group : g));
      }
      return [...prev, group];
    });
    
    return group;
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Gets all groups for a user
 */
async function fetchUserGroups(userId: string): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    const userGroups = await firebaseGetUserGroups(userId);
    setGroups(userGroups);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Gets a single group by ID
 */
async function fetchGroup(groupId: string): Promise<Group | null> {
  setError(null);
  setLoading(true);
  
  try {
    const group = await firebaseGetGroup(groupId);
    setCurrentGroup(group);
    return group;
  } catch (err) {
    handleError(err);
    return null;
  } finally {
    setLoading(false);
  }
}

/**
 * Gets all members of a group
 */
async function fetchGroupMembers(groupId: string): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    const members = await firebaseGetGroupMembers(groupId);
    setCurrentGroupMembers(members);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Removes a member from a group (admin only)
 */
async function removeMember(groupId: string, userId: string, adminId: string): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    await firebaseRemoveMember(groupId, userId, adminId);
    
    // Update local state
    setCurrentGroupMembers((prev) => prev.filter((m) => m.id !== userId));
    setCurrentGroup((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        memberIds: prev.memberIds.filter((id) => id !== userId),
      };
    });
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Leaves a group
 */
async function leaveGroup(groupId: string, userId: string): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    await firebaseLeaveGroup(groupId, userId);
    
    // Update local state
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (currentGroup()?.id === groupId) {
      setCurrentGroup(null);
      setCurrentGroupMembers([]);
    }
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Updates member stats
 */
async function updateMemberStats(
  groupId: string,
  userId: string,
  updates: {
    rating?: number;
    wins?: number;
    losses?: number;
    lastMatchAt?: Date;
  }
): Promise<void> {
  setError(null);
  
  try {
    await firebaseUpdateMemberStats(groupId, userId, updates);
    
    // Update local state
    setCurrentGroupMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? {
              ...m,
              rating: updates.rating ?? m.rating,
              wins: updates.wins ?? m.wins,
              losses: updates.losses ?? m.losses,
              lastMatchAt: updates.lastMatchAt ? updates.lastMatchAt : m.lastMatchAt,
            }
          : m
      )
    );
  } catch (err) {
    handleError(err);
    throw err;
  }
}

/**
 * Clears the current group selection
 */
function clearCurrentGroup(): void {
  setCurrentGroup(null);
  setCurrentGroupMembers([]);
}

/**
 * Clears all groups (on sign out)
 */
function clearGroups(): void {
  setGroups([]);
  setCurrentGroup(null);
  setCurrentGroupMembers([]);
  setError(null);
}

// ============================================================================
// Export Store
// ============================================================================

export const groupsStore = {
  // State (read-only signals)
  groups,
  currentGroup,
  currentGroupMembers,
  loading,
  error,
  
  // Actions
  createGroup,
  joinGroup,
  fetchUserGroups,
  fetchGroup,
  fetchGroupMembers,
  removeMember,
  leaveGroup,
  updateMemberStats,
  clearCurrentGroup,
  clearGroups,
  clearError,
};

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  groups,
  currentGroup,
  currentGroupMembers,
  loading,
  error,
  createGroup,
  joinGroup,
  fetchUserGroups,
  fetchGroup,
  fetchGroupMembers,
  removeMember,
  leaveGroup,
  updateMemberStats,
  clearCurrentGroup,
  clearGroups,
  clearError,
};
