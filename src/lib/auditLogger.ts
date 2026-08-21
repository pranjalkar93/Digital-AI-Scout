import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AuditActionType, AuditLog, DrillSubmission, SubscriptionTransaction, ScoutActionLog } from '../types';

/**
 * Log a user-wise transaction event to both:
 * 1. Global `/auditLogs/{logId}` collection
 * 2. User-specific subcollection `/users/{userId}/auditLogs/{logId}`
 */
export async function logAuditTransaction(
  userId: string,
  userName: string,
  userRole: string,
  actionType: AuditActionType,
  description: string,
  metadata?: Record<string, any>
): Promise<AuditLog> {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const timestamp = new Date().toISOString();

  const auditEntry: AuditLog = {
    id: logId,
    userId,
    userName: userName || 'Anonymous User',
    userRole: userRole || 'USER',
    actionType,
    description,
    metadata: metadata || {},
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent || 'Digital Scout Mobile Client',
    timestamp
  };

  try {
    // 1. Write to user-wise subcollection
    if (userId) {
      const userLogRef = doc(db, 'users', userId, 'auditLogs', logId);
      await setDoc(userLogRef, auditEntry);
    }

    // 2. Write to global audit log collection
    const globalLogRef = doc(db, 'auditLogs', logId);
    await setDoc(globalLogRef, auditEntry);

    console.log(`[Audit Logged] ${actionType} for ${userName} (${userId}): ${description}`);
  } catch (error) {
    console.warn(`[Audit Logger Note] Failed to persist audit log ${logId}:`, error);
  }

  return auditEntry;
}

/**
 * Record a drill submission performance to `/drillSubmissions`
 */
export async function recordDrillSubmission(submission: Omit<DrillSubmission, 'id' | 'timestamp'>): Promise<DrillSubmission> {
  const submissionId = `drill-sub-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const fullSubmission: DrillSubmission = {
    ...submission,
    id: submissionId,
    timestamp
  };

  try {
    // 1. Write to global /drillSubmissions
    await setDoc(doc(db, 'drillSubmissions', submissionId), fullSubmission);

    // 2. Write to user subcollection /users/{userId}/drillSubmissions
    if (submission.userId) {
      await setDoc(doc(db, 'users', submission.userId, 'drillSubmissions', submissionId), fullSubmission);
    }

    console.log(`[Drill Recorded] Saved submission ${submissionId} for drill ${submission.drillTitle} (Video URL: ${submission.videoUrl || 'Default URL'})`);

    // Automatically audit log the submission
    await logAuditTransaction(
      submission.userId,
      submission.userName,
      'PLAYER',
      'DRILL_ATTEMPT_SUBMIT',
      `Submitted score ${submission.score} for drill "${submission.drillTitle}"`,
      {
        score: submission.score,
        metricValue: submission.primaryMetricValue,
        tier: submission.tierAchieved,
        videoUrl: submission.videoUrl || ''
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `drillSubmissions/${submissionId}`);
  }

  return fullSubmission;
}

/**
 * Record a subscription transaction to `/subscriptionTransactions`
 */
export async function recordSubscriptionTransaction(tx: Omit<SubscriptionTransaction, 'id' | 'timestamp'>): Promise<SubscriptionTransaction> {
  const transactionId = `sub-tx-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const fullTransaction: SubscriptionTransaction = {
    ...tx,
    id: transactionId,
    timestamp
  };

  try {
    await setDoc(doc(db, 'subscriptionTransactions', transactionId), fullTransaction);
    console.log(`[Subscription Recorded] Saved transaction ${transactionId} for ${tx.userName}`);

    // Automatically audit log the transaction
    await logAuditTransaction(
      tx.userId,
      tx.userName,
      'USER',
      'SUBSCRIPTION_CHANGE',
      `Toggled plan "${tx.planName}" (${tx.status} - ₹${tx.amountInr})`,
      { amount: tx.amountInr, status: tx.status, method: tx.paymentMethod }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subscriptionTransactions/${transactionId}`);
  }

  return fullTransaction;
}

/**
 * Record a scout action to `/scoutActions`
 */
export async function recordScoutAction(action: Omit<ScoutActionLog, 'id' | 'timestamp'>): Promise<ScoutActionLog> {
  const actionId = `scout-act-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const fullAction: ScoutActionLog = {
    ...action,
    id: actionId,
    timestamp
  };

  try {
    await setDoc(doc(db, 'scoutActions', actionId), fullAction);
    console.log(`[Scout Action Recorded] Saved action ${action.action} for scout ${action.scoutName}`);

    // Automatically audit log
    await logAuditTransaction(
      action.scoutId,
      action.scoutName,
      'SCOUT',
      'SCOUT_SHORTLIST_TOGGLE',
      `Scout action "${action.action}" performed for player ${action.targetPlayerName}`,
      { targetPlayerId: action.targetPlayerId, notes: action.notes }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `scoutActions/${actionId}`);
  }

  return fullAction;
}
