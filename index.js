import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.set("trust proxy", 1);

const port = process.env.PORT || 8000;
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const clientUrl = rawClientUrl.replace(/\/$/, "");

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

const allowedOrigins = Array.from(
  new Set(["http://localhost:3000", clientUrl])
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const mongoClient = await connectToMongoDB();
const db = mongoClient.db(process.env.DB_NAME || "StudioSpace");
const studiosCollection = db.collection("studios");
const bookingsCollection = db.collection("bookings");
const wishlistCollection = db.collection("wishlist");

const JWKS = createRemoteJWKSet(
  new URL(`${clientUrl}/api/auth/jwks`)
);

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Challenge 1: HTTPOnly Cookie & Bearer JWT Verification
const verifyToken = async (req, res, next) => {
  const cookieToken = req.cookies?.studio_token;
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized access: No token provided." });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized access: Invalid or expired token." });
  }
};

// Seed 6 authentic studios if database is empty
const initialStudios = [
  {
    title: "Daylight Cyclorama Photo Loft",
    category: "Photo Studio",
    hourlyRate: 85,
    securityDeposit: 150,
    maxCapacity: 15,
    location: "Gulshan 2, Dhaka",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "White Cyclorama Wall",
      "Profoto Strobes",
      "Makeup & Dressing Room",
      "High-Speed Wi-Fi",
      "Freight Elevator",
    ],
    overview:
      "Sun-drenched 2,400 sq ft commercial photography loft featuring a seamless 20-foot infinity cyclorama wall, south-facing blackout-capable industrial windows, and full grip package.",
    ownerName: "Arafat Rahman",
    ownerEmail: "arafat@studiospace.io",
    rating: 4.9,
    reviewsCount: 28,
    reviews: [
      {
        userName: "Rafiul Islam",
        rating: 5,
        comment:
          "Incredible natural daylight and spotless cyclorama wall. Everything worked seamlessly.",
        date: "2026-10-12",
      },
    ],
    createdAt: new Date("2026-10-01T10:00:00Z"),
  },
  {
    title: "Blackbox Cinema Sound Stage",
    category: "Film Stage",
    hourlyRate: 140,
    securityDeposit: 300,
    maxCapacity: 30,
    location: "Banani, Dhaka",
    image:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "Acoustic Soundproofing",
      "Pre-Lit Overhead Grid",
      "3-Phase Power",
      "Green Room Lounge",
      "Chroma Green Screen",
    ],
    overview:
      "Fully sound-treated production stage engineered for commercial film shoots, music videos, and virtual production with an overhead DMX lighting grid and isolated control booth.",
    ownerName: "Nadia Chowdhury",
    ownerEmail: "nadia@studiospace.io",
    rating: 5.0,
    reviewsCount: 19,
    reviews: [
      {
        userName: "Tanvir Ahmed",
        rating: 5,
        comment:
          "Zero outside noise and heavy-duty power distribution. Best film stage in town.",
        date: "2026-10-18",
      },
    ],
    createdAt: new Date("2026-10-05T10:00:00Z"),
  },
  {
    title: "Velvet Mic Podcast & Vodcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 55,
    securityDeposit: 100,
    maxCapacity: 6,
    location: "Dhanmondi, Dhaka",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "4x Shure SM7B Mics",
      "RODECaster Pro II",
      "3x 4K Sony Cinema Cams",
      "Custom RGB Set Lighting",
      "Live Engineer Included",
    ],
    overview:
      "Turnkey multi-camera podcast and video interview lounge outfitted with broadcast dynamic microphones, acoustic slat walls, and customizable ambient set design.",
    ownerName: "Tariq Hasan",
    ownerEmail: "tariq@studiospace.io",
    rating: 4.8,
    reviewsCount: 42,
    reviews: [
      {
        userName: "Maliha Khan",
        rating: 5,
        comment:
          "Walked in and started recording in 5 minutes. Crisp audio and gorgeous camera angles.",
        date: "2026-10-21",
      },
    ],
    createdAt: new Date("2026-10-10T10:00:00Z"),
  },
  {
    title: "Analog Mastering & Vocal Suite",
    category: "Music Suite",
    hourlyRate: 75,
    securityDeposit: 150,
    maxCapacity: 8,
    location: "Uttara Sector 7, Dhaka",
    image:
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "Neumann U87 Vocal Booth",
      "Genelec Monitoring",
      "Analog Outboard Rack",
      "MIDI & Synth Collection",
      "Private Lounge",
    ],
    overview:
      "Precision-tuned recording and mixing room featuring an isolated floating vocal booth, flagship studio monitors, and classic analog preamps for musicians and voice artists.",
    ownerName: "Samiul Karim",
    ownerEmail: "samiul@studiospace.io",
    rating: 4.9,
    reviewsCount: 34,
    reviews: [
      {
        userName: "Zayed Hossain",
        rating: 5,
        comment:
          "The acoustic treatment and vocal chain gave our EP an unmistakable warmth.",
        date: "2026-10-24",
      },
    ],
    createdAt: new Date("2026-10-15T10:00:00Z"),
  },
  {
    title: "Skylight Ceramics & Art Workshop",
    category: "Workshop",
    hourlyRate: 45,
    securityDeposit: 80,
    maxCapacity: 20,
    location: "Lalmatia, Dhaka",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "Natural North Skylight",
      "Heavy-Duty Worktables",
      "Utility Wash Sinks",
      "Easels & Stools",
      "Exhibition Wall",
    ],
    overview:
      "Bright, inspiring creative workshop designed for painting sessions, sculpture classes, brand pop-ups, and hands-on design retreats with modular oak worktables.",
    ownerName: "Farhana Islam",
    ownerEmail: "farhana@studiospace.io",
    rating: 4.7,
    reviewsCount: 16,
    reviews: [
      {
        userName: "Nusrat Jahan",
        rating: 5,
        comment:
          "Hosted our weekend watercolor workshop here. Spacious, airy, and well-equipped.",
        date: "2026-10-28",
      },
    ],
    createdAt: new Date("2026-10-20T10:00:00Z"),
  },
  {
    title: "Neon Editorial & Fashion Studio",
    category: "Photo Studio",
    hourlyRate: 95,
    securityDeposit: 180,
    maxCapacity: 12,
    location: "Baridhara DOHS, Dhaka",
    image:
      "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    ],
    amenities: [
      "Motorized Paper Backdrops",
      "Aputure 600d Lights",
      "Tethering Workstation",
      "Steamer & Wardrobe Rack",
      "Espresso Bar",
    ],
    overview:
      "Editorial fashion and lookbook studio equipped with a 6-roll motorized backdrop system, continuous cinema LEDs, and a dedicated styling suite.",
    ownerName: "Arafat Rahman",
    ownerEmail: "arafat@studiospace.io",
    rating: 4.9,
    reviewsCount: 22,
    reviews: [
      {
        userName: "Shafiqul Alam",
        rating: 5,
        comment:
          "Motorized backdrops saved us hours during our lookbook shoot.",
        date: "2026-11-01",
      },
    ],
    createdAt: new Date("2026-10-25T10:00:00Z"),
  },
];

const existingCount = await studiosCollection.countDocuments();
if (existingCount === 0) {
  await studiosCollection.insertMany(initialStudios);
  console.log("Seeded 6 authentic studios into MongoDB.");
}

// ==================== HTTPONLY COOKIE AUTH ROUTES ====================
app.post("/api/auth/set-cookie", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required." });
    }

    await jwtVerify(token, JWKS);

    res.cookie("studio_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "HTTPOnly cookie set successfully." });
  } catch (error) {
    res.status(401).json({ message: "Invalid JWT token." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("studio_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true, message: "Cookie cleared." });
});

// ==================== STUDIOS CRUD ROUTES ====================
app.get("/api/studios", async (req, res) => {
  try {
    const { category, search, limit, ownerEmail, sort } = req.query;
    const query = {};

    if (category && category !== "All") {
      const categoryMap = {
        "Photo Studios": ["Photo Studio", "Photo Studios"],
        "Photo Studio": ["Photo Studio", "Photo Studios"],
        "Sound Stages": ["Film Stage", "Sound Stages", "Sound Stage"],
        "Film Stage": ["Film Stage", "Sound Stages", "Sound Stage"],
        "Podcast Rooms": ["Podcast Lounge", "Podcast Rooms", "Podcast Room"],
        "Podcast Lounge": ["Podcast Lounge", "Podcast Rooms", "Podcast Room"],
        "Music Suites": ["Music Suite", "Music Suites"],
        "Music Suite": ["Music Suite", "Music Suites"],
        "Art Workshops": ["Workshop", "Art Workshops", "Art Workshop"],
        "Workshop": ["Workshop", "Art Workshops", "Art Workshop"],
      };

      const matchedCategories = categoryMap[category] || [category];
      query.category = { $in: matchedCategories };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (ownerEmail) {
      query.ownerEmail = ownerEmail;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "price_asc") sortOption = { hourlyRate: 1 };
    if (sort === "price_desc") sortOption = { hourlyRate: -1 };

    let cursor = studiosCollection.find(query).sort(sortOption);
    if (limit) {
      cursor = cursor.limit(parseInt(limit, 10));
    }

    const studios = await cursor.toArray();
    res.json(studios);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch studios." });
  }
});

app.get("/api/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid studio ID." });
    }

    const studio = await studiosCollection.findOne({ _id: new ObjectId(id) });
    if (!studio) {
      return res.status(404).json({ message: "Studio not found." });
    }

    res.json(studio);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch studio details." });
  }
});

app.post("/api/studios", verifyToken, async (req, res) => {
  try {
    const data = req.body;

    const newStudio = {
      title: data.title,
      category: data.category,
      hourlyRate: Number(data.hourlyRate),
      securityDeposit: Number(data.securityDeposit),
      maxCapacity: Number(data.maxCapacity),
      location: data.location,
      image: data.image,
      gallery: [data.image],
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      overview: data.overview,
      ownerName: data.ownerName || req.user.name || "Studio Host",
      ownerEmail: req.user.email,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      createdAt: new Date(),
    };

    const result = await studiosCollection.insertOne(newStudio);
    res.status(201).json({
      message: "Studio created successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create studio." });
  }
});

app.put("/api/studios/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid studio ID." });
    }

    const existing = await studiosCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: "Studio not found." });
    }

    if (existing.ownerEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own studio." });
    }

    const data = req.body;
    const updateDoc = {
      $set: {
        title: data.title,
        category: data.category,
        hourlyRate: Number(data.hourlyRate),
        securityDeposit: Number(data.securityDeposit),
        maxCapacity: Number(data.maxCapacity),
        location: data.location,
        image: data.image,
        gallery: [data.image],
        amenities: Array.isArray(data.amenities)
          ? data.amenities
          : existing.amenities,
        overview: data.overview,
        updatedAt: new Date(),
      },
    };

    await studiosCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
    res.json({ message: "Studio updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update studio." });
  }
});

app.delete("/api/studios/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid studio ID." });
    }

    const existing = await studiosCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: "Studio not found." });
    }

    if (existing.ownerEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own studio." });
    }

    await studiosCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Studio deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete studio." });
  }
});

// ==================== BOOKINGS ROUTES ====================
app.get("/api/bookings", verifyToken, async (req, res) => {
  try {
    const bookings = await bookingsCollection
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

// Challenge 2: Double-Booking Prevention against Confirmed bookings
app.post("/api/bookings", verifyToken, async (req, res) => {
  try {
    const {
      studioId,
      studioTitle,
      studioImage,
      studioLocation,
      category,
      hourlyRate,
      securityDeposit,
      bookingDate,
      startTime,
      endTime,
      totalHours,
      totalPrice,
      notes,
    } = req.body;

    if (!studioId || !bookingDate || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time, and end time are required." });
    }

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (newEnd <= newStart) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }

    const confirmedBookings = await bookingsCollection
      .find({
        studioId,
        bookingDate,
        status: "Confirmed",
      })
      .toArray();

    const hasOverlap = confirmedBookings.some((existing) => {
      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      return res.status(409).json({
        message:
          "Time slot unavailable! This studio already has a Confirmed booking during these hours.",
      });
    }

    const newBooking = {
      studioId,
      studioTitle,
      studioImage,
      studioLocation,
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit),
      bookingDate,
      startTime,
      endTime,
      totalHours: Number(totalHours),
      totalPrice: Number(totalPrice),
      notes: notes || "",
      userEmail: req.user.email,
      userName: req.user.name || "Creator",
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);
    res.status(201).json({
      message: "Booking submitted! Status is Pending.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create booking." });
  }
});

app.patch("/api/bookings/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden action." });
    }

    if (booking.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only Pending bookings can be cancelled." });
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Cancelled", updatedAt: new Date() } }
    );

    res.json({ message: "Booking cancelled successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel booking." });
  }
});

app.patch("/api/bookings/:id/confirm", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Confirmed", updatedAt: new Date() } }
    );

    res.json({ message: "Booking confirmed!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to confirm booking." });
  }
});

// ==================== WISHLIST ROUTES (Optional Requirement) ====================
app.get("/api/wishlist", verifyToken, async (req, res) => {
  try {
    const items = await wishlistCollection
      .find({ userEmail: req.user.email })
      .toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wishlist." });
  }
});

app.post("/api/wishlist/toggle", verifyToken, async (req, res) => {
  try {
    const { studioId } = req.body;
    const existing = await wishlistCollection.findOne({
      userEmail: req.user.email,
      studioId,
    });

    if (existing) {
      await wishlistCollection.deleteOne({ _id: existing._id });
      return res.json({ saved: false, message: "Removed from wishlist." });
    }

    await wishlistCollection.insertOne({
      userEmail: req.user.email,
      studioId,
      createdAt: new Date(),
    });
    res.json({ saved: true, message: "Saved to wishlist!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update wishlist." });
  }
});

app.get("/", (req, res) => {
  res.send("StudioSpace API Server is running...");
});

app.listen(port, () => {
  console.log(`StudioSpace server listening on port ${port}`);
});