const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

(async () => {
  const snapshot = await db
    .collection("quizRuns")
    .where("mode", "==", "smart")
    .get();

  let fixed = 0;

  for (const doc of snapshot.docs) {
    const run = doc.data();

    if (run.status === "completed") continue;
    if (run.status === "in_progress" && run.isActive === true) continue;

    await doc.ref.update({
      status: "in_progress",
      isActive: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Repaired Smart Quiz Run:", doc.id);
    fixed++;
  }

  console.log("DONE. Runs repaired:", fixed);
  process.exit(0);
})();
