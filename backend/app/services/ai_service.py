import json
import google.generativeai as genai
from app.config import settings


def configure_gemini():
    """Configure the Gemini API client."""
    genai.configure(api_key=settings.GEMINI_API_KEY)


async def analyze_resume(resume_text: str, job_description: str) -> dict:
    """
    Send resume text and job description to Gemini API for analysis.
    Returns structured analysis results including ATS score, skill gaps,
    section-wise quality scores, experience bullet analysis, and parsed sections.
    """
    configure_gemini()
    # Configure generation parameters for consistent, reliable ATS scoring:
    # - temperature=0.2: Low temperature reduces randomness and prevents wild score fluctuations across repeated runs
    # - response_mime_type="application/json": Guarantees structured JSON output directly from Gemini
    generation_config = genai.types.GenerationConfig(
        temperature=0.2,
        response_mime_type="application/json",
    )

    model = genai.GenerativeModel(
        "gemini-3.1-flash-lite",
        generation_config=generation_config,
    )

    prompt = f"""You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.
Analyze the following resume against the provided job description and return a comprehensive analysis.

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
    "suggestions": ["<suggestion1>", "<suggestion2>", ...],
    "sectionScores": {{
        "summary": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about the summary/objective section>"
        }},
        "experience": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about the experience section>"
        }},
        "education": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about the education section>"
        }},
        "skills": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about the skills section>"
        }},
        "projects": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about the projects section>"
        }},
        "formatting": {{
            "score": <integer 0-100>,
            "feedback": "<specific feedback about resume formatting and structure>"
        }}
    }},
    "bulletAnalysis": [
        {{
            "original": "<exact weak/generic bullet point from the resume>",
            "issue": "<what's wrong with this bullet point>",
            "improved": "<stronger, action-oriented version with measurable impact>"
        }}
    ],
    "parsedSections": {{
        "contactInfo": "<extracted contact information or null if not found>",
        "summary": "<extracted professional summary/objective or null>",
        "experience": ["<each experience entry as a string>"],
        "education": ["<each education entry as a string>"],
        "skills": ["<each individual skill>"],
        "projects": ["<each project entry as a string>"],
        "certifications": ["<each certification as a string>"]
    }}
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
- sectionScores: Score each section 0-100 based on quality, relevance to the job, and completeness. If a section is missing from the resume, give it a score of 0 with feedback noting it's absent.
- bulletAnalysis: Find 3-5 of the weakest/most generic bullet points in the experience section. For each, explain the issue and provide a stronger, action-oriented alternative using measurable impact (numbers, percentages, scale). If there are no weak bullets, return an empty array.
- parsedSections: Extract and structure the resume content into sections. Use null for sections not found, empty arrays for list sections not found.
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

        # Validate sectionScores — ensure all 6 sections exist with defaults
        default_section = {"score": 0, "feedback": "Section not evaluated."}
        if "sectionScores" not in result or not isinstance(result["sectionScores"], dict):
            result["sectionScores"] = {}
        for section in ["summary", "experience", "education", "skills", "projects", "formatting"]:
            if section not in result["sectionScores"] or not isinstance(result["sectionScores"][section], dict):
                result["sectionScores"][section] = default_section.copy()
            else:
                sec = result["sectionScores"][section]
                sec["score"] = max(0, min(100, int(sec.get("score", 0))))
                sec["feedback"] = sec.get("feedback", "No feedback available.")

        # Validate bulletAnalysis — ensure it's a list of proper objects
        if "bulletAnalysis" not in result or not isinstance(result["bulletAnalysis"], list):
            result["bulletAnalysis"] = []
        else:
            validated_bullets = []
            for bullet in result["bulletAnalysis"]:
                if isinstance(bullet, dict) and "original" in bullet:
                    validated_bullets.append({
                        "original": bullet.get("original", ""),
                        "issue": bullet.get("issue", "Could be stronger"),
                        "improved": bullet.get("improved", bullet.get("original", "")),
                    })
            result["bulletAnalysis"] = validated_bullets

        # Validate parsedSections — ensure structure with defaults
        if "parsedSections" not in result or not isinstance(result["parsedSections"], dict):
            result["parsedSections"] = {}
        ps = result["parsedSections"]
        ps.setdefault("contactInfo", None)
        ps.setdefault("summary", None)
        for list_field in ["experience", "education", "skills", "projects", "certifications"]:
            if list_field not in ps or not isinstance(ps[list_field], list):
                ps[list_field] = []

        return result

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise ValueError(f"AI analysis failed: {str(e)}")
