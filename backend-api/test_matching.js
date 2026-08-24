import { calculateTripCompatibilityDetailed } from './src/controllers/matchController.js';

// Mock trip and users
const trip = {
    budget: 2000,
    activityStyle: 5,
    timeOfDay: ["morning", "noon"],
    category: "คาเฟ่",
    creator: { travelStyle: { budget: 2000, activityStyle: 5, timeOfDay: ["morning"] } },
    participants: [
        { user: { id: "p1", interests: ["คาเฟ่", "ถ่ายรูป"], travelStyle: { budget: 2000, activityStyle: 5, timeOfDay: ["morning", "noon"] } } },
        { user: { id: "p2", interests: ["คาเฟ่"], travelStyle: { budget: 1700, activityStyle: 5, timeOfDay: ["morning"] } } }
    ]
};

const userA = {
    id: "userA",
    interests: ["คาเฟ่", "ถ่ายรูป"],
    travelStyle: { budget: 2000, activityStyle: 5, timeOfDay: ["morning", "noon"] }
};

const userB = {
    id: "userB",
    interests: ["ผจญภัย"],
    travelStyle: { budget: 1700, activityStyle: 10, timeOfDay: ["night"] }
};

const cosineTrace = (userValues, tripValues) => {
    const userSet = new Set(userValues);
    const tripSet = new Set(tripValues);
    const dotProduct = [...userSet].filter(value => tripSet.has(value)).length;
    const userMagnitude = Math.sqrt(userSet.size);
    const tripMagnitude = Math.sqrt(tripSet.size);
    const denominator = userMagnitude * tripMagnitude;
    const cosine = denominator > 0 ? dotProduct / denominator : 0;
    return { dotProduct, userMagnitude, tripMagnitude, denominator, cosine };
};

const printMatchResult = (title, user, result) => {
    const { breakdown } = result;
    const categoryTrace = cosineTrace(user.interests, [trip.category]);
    const timeTrace = cosineTrace(user.travelStyle.timeOfDay, trip.timeOfDay);
    const weightedSimilarity = (
        ((breakdown.budget ?? 0) * 0.30)
        + ((breakdown.activityStyle ?? 0) * 0.20)
        + ((breakdown.category ?? 0) * 0.35)
        + ((breakdown.timeOfDay ?? 0) * 0.15)
    ) / 100;

    console.log(`\n=== ${title} ===`);
    console.log(JSON.stringify({
        weightedSimilarity: Number(weightedSimilarity.toFixed(4)),
        cosine: {
            category: Number(categoryTrace.cosine.toFixed(4)),
            timeOfDay: Number(timeTrace.cosine.toFixed(4))
        },
        total: result.total,
        breakdown: result.breakdown,
        tripMatch: result.tripMatch
    }, null, 2));
};

const resA = calculateTripCompatibilityDetailed(userA, trip);
printMatchResult('Match User A (Similar to group)', userA, resA);

const resB = calculateTripCompatibilityDetailed(userB, trip);
printMatchResult('Match User B (Very different)', userB, resB);
