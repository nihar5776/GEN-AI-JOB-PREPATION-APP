const pdfParse = require('pdf-parse');
const path = require('path'); 
const upload = require("../middlewares/file.middleware").upload
const aiService = require("../services/ai.services")
const interviewReportModel = require("../models/interviewReportModel")

async function generateUserInterviewReport(req, res) {
  const resume = req.file;

  if (!resume) {
    return res.status(400).json({
      message: "Resume file is required"
    });
  }

  const { selfDescription, jobDescription } = req.body;

  const pdfData = await pdfParse(resume.buffer);

  const response = await aiService.generateInterviewReport({
    resume: pdfData.text,
    jobDescription: jobDescription || "General Profile Assessment",
    selfDescription: selfDescription || ""
  });

  const userId = req.user ? (req.user.userId || req.user.id) : null;

  const savedReport = await interviewReportModel.create({
    jobDescription: jobDescription || "General Profile Assessment",
    resume: pdfData.text,
    selfDescription: selfDescription || "",
    matchScore: response.matchScore,
    technicalQuestions: response.technicalQuestions,
    behavioralQuestions: response.behavioralQuestions,
    skillGaps: response.skillGaps,
    preparationPlan: response.preparationPlan,
    user: userId,
    title: response.title || "Career Profile Assessment"
  });

  res.status(201).json({
    status: "Successful",
    response: savedReport
  });
}

async function getUserInterviewReportsHistory(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const reports = await interviewReportModel.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      status: "Successful",
      reports
    });
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: "Failed to fetch reports history",
      error: err.message
    });
  }
}

module.exports = {
  generateUserInterviewReport,
  getUserInterviewReportsHistory
}