import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic Info
    dateOfBirth: { type: String },
    address: { type: String },

    // Academic Info
    institution: { type: String },
    degree: { type: String },
    branch: { type: String },
    cgpa: { type: String },
    graduationYear: { type: String },
    tenthPercentage: { type: Number, default: 0 },
    twelthPercentage: { type: Number, default: 0 },
    compositeScore: { type: Number, default: 0 },
    cocubesScore: { type: Number, default: 0 },

    // Coding Platforms
    codingProfiles: [
      {
        platform: { type: String },
        username: { type: String },
        profileLink: { type: String },
        rating: { type: String },
      },
    ],

    // Professional Profiles
    professionalProfiles: [
      {
        platform: { type: String },   // e.g. GitHub, LinkedIn
        link: { type: String },
      },
    ],

    // Skills
    skills: [{ type: String }],

    // Projects
    projects: [
      {
        title: { type: String },
        description: { type: String },
        technologies: [{ type: String }],
        link: { type: String },
      },
    ],

    // Experience
    experience: [
      {
        company: { type: String },
        role: { type: String },
        duration: { type: String },
        description: { type: String },
      },
    ],

    // Achievements
    achievements: [{ type: String }],
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
