import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// ============================================================================
// Types
// ============================================================================

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  adminId: string;
  memberIds: string[];
  createdAt: Date;
}

export interface GroupMember {
  id: string;
  rating: number;
  wins: number;
  losses: number;
  joinedAt: Date;
  lastMatchAt: Date | null;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const CreateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be less than 100 characters"),
  adminId: z.string().min(1, "Admin ID is required"),
});

export const JoinGroupSchema = z.object({
  inviteCode: z
    .string()
    .length(8, "Invite code must be 8 characters")
    .toUpperCase(),
  userId: z.string().min(1, "User ID is required"),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type JoinGroupInput = z.infer<typeof JoinGroupSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique 8-character invite code
 * Format: 2 uppercase letters + 6 alphanumeric characters
 */
function generateInviteCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  
  // First 2 characters are letters
  let code = "";
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Remaining 6 characters can be letters or numbers
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Converts Firestore timestamp to Date
 */
function timestampToDate(timestamp: unknown): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
}

/**
 * Checks if an invite code already exists in the database
 */
async function isInviteCodeUnique(code: string): Promise<boolean> {
  const groupsRef = collection(db, "groups");
  const q = query(groupsRef, where("inviteCode", "==", code));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * Generates a unique invite code that doesn't exist in the database
 */
export async function generateUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!(await isInviteCodeUnique(code)) && attempts < maxAttempts) {
    code = generateInviteCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique invite code");
  }
  
  return code;
}

// ============================================================================
// Group CRUD Operations
// ============================================================================

/**
 * Creates a new group with the given admin as the first member
 */
export async function createGroup(name: string, adminId: string): Promise<Group> {
  // Validate input
  const input = CreateGroupSchema.parse({ name, adminId });
  
  // Generate unique invite code
  const inviteCode = await generateUniqueInviteCode();
  
  // Create group document
  const groupsRef = collection(db, "groups");
  const groupDoc = await addDoc(groupsRef, {
    name: input.name,
    inviteCode,
    adminId: input.adminId,
    memberIds: [input.adminId],
    createdAt: serverTimestamp(),
  });
  
  // Create member document for admin
  const memberRef = doc(db, `groups/${groupDoc.id}/members`, input.adminId);
  await setDoc(memberRef, {
    rating: 1500,
    wins: 0,
    losses: 0,
    joinedAt: serverTimestamp(),
  });
  
  // Return created group
  const groupSnap = await getDoc(doc(db, "groups", groupDoc.id));
  const groupData = groupSnap.data();
  
  return {
    id: groupDoc.id,
    name: groupData?.name || input.name,
    inviteCode: groupData?.inviteCode || inviteCode,
    adminId: groupData?.adminId || input.adminId,
    memberIds: groupData?.memberIds || [input.adminId],
    createdAt: timestampToDate(groupData?.createdAt),
  };
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

export function validateCreateGroupInput(data: unknown): CreateGroupInput {
  return CreateGroupSchema.parse(data);
}

export function validateJoinGroupInput(data: unknown): JoinGroupInput {
  return JoinGroupSchema.parse(data);
}

/**
 * Get error message for group operations
 */
export function getGroupErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Invalid invite code")) {
      return "Invalid invite code. Please check and try again.";
    }
    if (message.includes("already a member")) {
      return "You are already a member of this group.";
    }
    if (message.includes("only the group admin")) {
      return "Only the group admin can perform this action.";
    }
    if (message.includes("Cannot remove the group admin")) {
      return "Cannot remove the group admin.";
    }
    if (message.includes("Admin cannot leave")) {
      return "Admin cannot leave the group. Transfer admin role or delete the group instead.";
    }
    if (message.includes("Group not found")) {
      return "Group not found.";
    }
    if (message.includes("Failed to generate unique invite code")) {
      return "Failed to generate invite code. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

// ============================================================================
// Additional Group Operations
// ============================================================================

/**
 * Joins a group using an invite code
 */
export async function joinGroup(inviteCode: string, userId: string): Promise<Group> {
  const input = JoinGroupSchema.parse({ inviteCode, userId });

  // Find group by invite code
  const groupsRef = collection(db, "groups");
  const q = query(groupsRef, where("inviteCode", "==", input.inviteCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid invite code");
  }

  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data();

  // Check if user is already a member
  if (groupData.memberIds.includes(userId)) {
    throw new Error("You are already a member of this group");
  }

  // Add user to group
  const groupRef = doc(db, "groups", groupDoc.id);
  await updateDoc(groupRef, {
    memberIds: arrayUnion(userId),
  });

  // Create member document for new user
  const memberRef = doc(db, `groups/${groupDoc.id}/members`, userId);
  await setDoc(memberRef, {
    rating: 1500,
    wins: 0,
    losses: 0,
    joinedAt: serverTimestamp(),
  });

  // Return updated group
  return getGroup(groupDoc.id);
}

/**
 * Gets all groups for a user
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  const groupsRef = collection(db, "groups");
  const q = query(groupsRef, where("memberIds", "array-contains", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      inviteCode: data.inviteCode,
      adminId: data.adminId,
      memberIds: data.memberIds || [],
      createdAt: timestampToDate(data.createdAt),
    } as Group;
  });
}

/**
 * Gets a single group by ID
 */
export async function getGroup(groupId: string): Promise<Group> {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    throw new Error("Group not found");
  }

  const data = groupSnap.data();
  return {
    id: groupSnap.id,
    name: data.name,
    inviteCode: data.inviteCode,
    adminId: data.adminId,
    memberIds: data.memberIds || [],
    createdAt: timestampToDate(data.createdAt),
  } as Group;
}

/**
 * Gets all members of a group
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const membersRef = collection(db, `groups/${groupId}/members`);
  const snapshot = await getDocs(membersRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      rating: data.rating || 1500,
      wins: data.wins || 0,
      losses: data.losses || 0,
      joinedAt: timestampToDate(data.joinedAt),
      lastMatchAt: data.lastMatchAt ? timestampToDate(data.lastMatchAt) : null,
    } as GroupMember;
  });
}

/**
 * Removes a member from a group (admin only)
 */
export async function removeMember(groupId: string, userId: string, adminId: string): Promise<void> {
  const group = await getGroup(groupId);

  // Verify admin
  if (group.adminId !== adminId) {
    throw new Error("only the group admin can remove members");
  }

  // Cannot remove admin
  if (userId === adminId) {
    throw new Error("Cannot remove the group admin");
  }

  // Remove user from group
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    memberIds: arrayRemove(userId),
  });

  // Delete member document
  const memberRef = doc(db, `groups/${groupId}/members`, userId);
  await deleteDoc(memberRef);
}

/**
 * Leaves a group
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId);

  // Admin cannot leave
  if (group.adminId === userId) {
    throw new Error("Admin cannot leave");
  }

  // Remove user from group
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    memberIds: arrayRemove(userId),
  });

  // Delete member document
  const memberRef = doc(db, `groups/${groupId}/members`, userId);
  await deleteDoc(memberRef);
}

/**
 * Updates member stats
 */
export async function updateMemberStats(
  groupId: string,
  userId: string,
  updates: {
    rating?: number;
    wins?: number;
    losses?: number;
    lastMatchAt?: Date;
  }
): Promise<void> {
  const memberRef = doc(db, `groups/${groupId}/members`, userId);
  const updateData: Record<string, unknown> = {};

  if (updates.rating !== undefined) {
    updateData.rating = updates.rating;
  }
  if (updates.wins !== undefined) {
    updateData.wins = updates.wins;
  }
  if (updates.losses !== undefined) {
    updateData.losses = updates.losses;
  }
  if (updates.lastMatchAt !== undefined) {
    updateData.lastMatchAt = updates.lastMatchAt;
  }

  await updateDoc(memberRef, updateData);
}
