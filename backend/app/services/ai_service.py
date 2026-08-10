import json
import google.generativeai as genai
from app.config import settings


def configure_gemini():
    """Configure the Gemini API client."""
    genai.configure(api_key=settings.GEMINI_API_KEY)


async def analyze_resume(resume_text: str, job_description: str) -> dict:
    """
    Send resume text and job description to Gemini API for analysis.
    Returns structured analysis results.
    """
    configure_gemini()

    model = genai.GenerativeModel("gemini-3.1-flash-lite")

    prompt = f"""You are an expert ATS (Applicant Tracking System) resume analyzer. 
Analyze the following resume against the provided job description and return a detailed analysis.

RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{job_description}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just raw JSON):
{{
    "atsScore": <integer 0-100 representing how well the resume matches the job description>,
    "resumeSummary": "<brief 2-3 sentence summary of the resume>",
    "matchingSkills": ["<skill1>", "<skill2>", ...],
    "missingSkills": ["<skill1>", "<skill2>", ...],
    "missingKeywords": ["<keyword1>", "<keyword2>", ...],
    "strengths": ["<strength1>", "<strength2>", ...],
    "weaknesses": ["<weakness1>", "<weakness2>", ...],
    "suggestions": ["<suggestion1>", "<suggestion2>", ...]
}}

Rules:
- atsScore should be a realistic score based on keyword matching, skills alignment, and overall fit
- matchingSkills should list skills found in BOTH the resume and job description
- missingSkills should list skills required in the job description but NOT found in the resume
- missingKeywords should list important keywords from the job description that are absent in the resume
- strengths should highlight what the resume does well relative to the job description
- weaknesses should identify areas where the resume falls short
- suggestions should provide actionable recommendations to improve the resume for this specific job
- Each list should have 3-8 items
- Return ONLY valid JSON, no extra text
"""

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            response_text = "\n".join(lines)

        result = json.loads(response_text)

        # Validate and ensure all required fields exist
        required_fields = [
            "atsScore", "resumeSummary", "matchingSkills",
            "missingSkills", "missingKeywords", "strengths",
            "weaknesses", "suggestions"
        ]

        for field in required_fields:
            if field not in result:
                if field == "atsScore":
                    result[field] = 0
                elif field == "resumeSummary":
                    result[field] = "Unable to generate summary."
                else:
                    result[field] = []

        # Ensure atsScore is an integer between 0-100
        result["atsScore"] = max(0, min(100, int(result["atsScore"])))

        return result

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise ValueError(f"AI analysis failed: {str(e)}")
