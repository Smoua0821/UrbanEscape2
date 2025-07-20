const mongoose = require("mongoose");
const User = require("./User");
const LoopRoute = require("./LoopRoute");

async function cleanupUserCapturedImages({ dryRun = false } = {}) {
  await mongoose.connect(process.env.MONGO_URI);
  const validIds = await LoopRoute.distinct("_id");
  const valid = new Set(validIds.map(String));
  const cursor = User.find({}, { capturedImages: 1 }).cursor();
  const bulk = [];
  let changed = 0;

  for await (const u of cursor) {
    let modified = false;
    const updated = (u.capturedImages || []).map((ci) => {
      const filtered = (ci.images || []).filter((id) => valid.has(String(id)));
      if (filtered.length !== (ci.images || []).length) modified = true;
      return { ...ci.toObject(), images: filtered };
    });
    if (modified) {
      changed++;
      if (!dryRun) {
        bulk.push({
          updateOne: {
            filter: { _id: u._id },
            update: { $set: { capturedImages: updated } },
          },
        });
      }
    }
    if (bulk.length >= 1000) {
      await User.bulkWrite(bulk);
      bulk.length = 0;
    }
  }

  if (bulk.length) await User.bulkWrite(bulk);
  await mongoose.disconnect();
  return changed;
}

if (require.main === module) {
  const dry = !!process.env.DRY_RUN;
  cleanupUserCapturedImages({ dryRun: dry })
    .then((n) => {
      console.log("Users updated:", n);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { cleanupUserCapturedImages };
