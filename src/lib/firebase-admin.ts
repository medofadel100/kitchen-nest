/**
 * Firebase Admin SDK — للاستخدام في Next.js API Routes (server-side) فقط
 * بيتجاوز Firestore Security Rules لأنه بيشتغل بصلاحيات admin كاملة
 * مش للاستخدام في client components أو pages
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Firebase Admin SDK بيتحقق من بيانات الاعتماد بالترتيب ده:
  // 1. GOOGLE_APPLICATION_CREDENTIALS env var (مسار لملف service account JSON)
  // 2. متغيرات البيئة المخصصة زي اللي محددة تحت
  // 3. Application Default Credentials (لو على Google Cloud)
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kitchen-nest-3c59d';

  const hasPrivateKey = Boolean(privateKey);
  const hasClientEmail = Boolean(clientEmail);
  const hasAdc = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (hasPrivateKey && hasClientEmail) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else if (hasAdc) {
    // Fallback: Application Default Credentials
    // (شغّال تلقائياً على Firebase Hosting / Cloud Run / Vercel لو اتسيت)
    adminApp = initializeApp({ projectId });
  } else {
    // Throw a controlled error so API route can return a meaningful 500.
    throw new Error(
      [
        'Firebase Admin is not configured.',
        `FIREBASE_ADMIN_PRIVATE_KEY=${hasPrivateKey ? 'set' : 'missing'}`,
        `FIREBASE_ADMIN_CLIENT_EMAIL=${hasClientEmail ? 'set' : 'missing'}`,
        `GOOGLE_APPLICATION_CREDENTIALS=${hasAdc ? 'set' : 'missing'}`,
      ].join(' ')
    );
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}

