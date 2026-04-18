const admin = require("firebase-admin");
if (admin.apps.length === 0) admin.initializeApp({ projectId: "exam-coach-ai-platform" });
const db = admin.firestore();

async function main() {
  // Check actual examId for PMP questions
  const sample = await db.collection("questions").doc("iPDfTuvzkALzAF6IcSkg").get();
  const d = sample.data();
  console.log("Sample examId:", d.examId);
  console.log("Has active field:", "active" in d);
  console.log("Has retiredVersion:", "retiredVersion" in d);
  console.log("All top-level fields:", Object.keys(d).sort().join(", "));

  // Count current active questions
  const allDocs = await db.collection("questions").where("examId", "==", d.examId).get();
  const withActive = allDocs.docs.filter(doc => "active" in doc.data());
  const activeTrue = allDocs.docs.filter(doc => doc.data().active === true);
  const activeFalse = allDocs.docs.filter(doc => doc.data().active === false);
  console.log("\nTotal PMP questions:", allDocs.size);
  console.log("Have 'active' field:", withActive.length);
  console.log("active=true:", activeTrue.length);
  console.log("active=false:", activeFalse.length);
  console.log("No 'active' field:", allDocs.size - withActive.length);
  process.exit(0);
}
main();
