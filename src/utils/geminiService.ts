import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface AIQuizData {
  title: string;
  questions: QuizQuestion[];
  difficulty: "easy" | "medium" | "hard";
}

// Generate image search terms for lesson topics
export const generateImageSearchTerms = async (
  topic: string
): Promise<string> => {
  try {
    const prompt = `Tạo từ khóa tìm kiếm ảnh cho chủ đề "${topic}" trong giảng dạy. 
    Chỉ trả về 2-3 từ khóa ngắn gọn bằng tiếng Anh, phù hợp để tìm ảnh minh họa giáo dục.
    Ví dụ: "education students classroom" hoặc "science laboratory experiment"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating image search terms:", error);
    // Fallback search terms
    return "education learning students";
  }
};

// Get random image from Unsplash
export const getRandomImage = async (searchTerms?: string): Promise<string> => {
  try {
    const terms = searchTerms || "education learning";
    const response = await fetch(
      `https://source.unsplash.com/800x400/?${encodeURIComponent(
        terms
      )}&${Date.now()}`
    );
    return response.url;
  } catch (error) {
    console.error("Error fetching image:", error);
    // Fallback to default education image
    return "https://source.unsplash.com/800x400/?education";
  }
};

// Generate AI quiz questions
export const generateAIQuiz = async (
  difficulty: "easy" | "medium" | "hard"
): Promise<AIQuizData> => {
  try {
    const difficultyDescriptions = {
      easy: "cơ bản, dễ hiểu, phù hợp người mới bắt đầu",
      medium: "trung bình, cần suy nghĩ và phân tích",
      hard: "khó, cần kiến thức sâu và tư duy logic cao",
    };

    // Always focus on Ho Chi Minh theme
    const topicPrompt =
      "Sự ra đời, bản chất, chức năng của Nhà nước xã hội chủ nghĩa";

    const prompt = `Tạo một bộ 5 câu hỏi trắc nghiệm ${topicPrompt} với độ khó ${difficultyDescriptions[difficulty]}.

Nội dung câu hỏi phải bao gồm:
- Lịch sử hình thành và phát triển của Nhà nước xã hội chủ nghĩa
- Bản chất và vai trò của Nhà nước xã hội chủ nghĩa
- Chức năng và nhiệm vụ của Nhà nước xã hội chủ nghĩa
- Mối quan hệ giữa Nhà nước xã hội chủ nghĩa với nhân dân và các tổ chức xã hội
- Các quan điểm của Hồ Chí Minh về Nhà nước xã hội chủ nghĩa
- Mối quan hệ giữa dân chủ xã hội chủ nghĩa và nhà nước xã hội chủ nghĩa

Trả về kết quả theo định dạng JSON chính xác sau:
{
  "title": "Tên bộ câu hỏi về Nhà nước xã hội chủ nghĩa - Độ khó ${difficulty}",
  "questions": [
    {
      "question": "Câu hỏi về Hồ Chí Minh",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correct": 0,
      "explanation": "Giải thích chi tiết tại sao đáp án này đúng"
    }
  ]
}

Yêu cầu:
- 5 câu hỏi đa dạng và thú vị về Hồ Chí Minh
- 4 đáp án cho mỗi câu (A, B, C, D)
- Chỉ số correct từ 0-3 (0=A, 1=B, 2=C, 3=D)
- Giải thích chi tiết và dễ hiểu về Nhà nước xã hội chủ nghĩa
- Nội dung phù hợp với độ khó ${difficulty}`;

    console.log("Starting AI quiz generation with difficulty:", difficulty);
    const result = await model.generateContent(prompt);
    console.log("AI response received");
    const response = result.response;
    const text = response.text().trim();
    console.log("AI response text:", text.substring(0, 500) + "..."); // Log first 500 chars

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON found in response");
      throw new Error("No valid JSON found in response");
    }

    console.log("JSON match found:", jsonMatch[0].substring(0, 200) + "...");
    const quizData = JSON.parse(jsonMatch[0]) as AIQuizData;
    quizData.difficulty = difficulty;

    // Validate the quiz data
    if (!quizData.questions || quizData.questions.length !== 5) {
      throw new Error("Invalid quiz data structure");
    }

    return quizData;
  } catch (error) {
    console.error("Error generating AI quiz:", error);

    // Fallback quiz data about Nhà nước xã hội chủ nghĩa
    return {
      title: `Nhà nước xã hội chủ nghĩa - Độ khó ${
        difficulty === "easy"
          ? "Dễ"
          : difficulty === "medium"
          ? "Trung bình"
          : "Khó"
      }`,
      difficulty,
      questions: [
        {
          question: "Nhà nước xã hội chủ nghĩa ra đời trên cơ sở nào?",
          options: [
            "Sự phát triển của lực lượng sản xuất và đấu tranh giai cấp vô sản", // đúng
            "Do nhu cầu mở rộng lãnh thổ",
            "Từ sự thoái hóa của nhà nước phong kiến",
            "Do các tập đoàn kinh tế lập ra",
          ],
          correct: 0,
          explanation:
            "Nhà nước XHCN ra đời từ sự phát triển của lực lượng sản xuất và kết quả đấu tranh giai cấp của giai cấp vô sản chống lại giai cấp tư sản.",
        },
        {
          question:
            "Điểm khác biệt cơ bản giữa nhà nước XHCN và nhà nước tư sản là gì?",
          options: [
            "Nhà nước XHCN có quân đội mạnh hơn",
            "Nhà nước XHCN có lãnh thổ rộng lớn hơn",
            "Nhà nước XHCN tồn tại vĩnh viễn không thay đổi",
            "Nhà nước XHCN là công cụ chuyên chính của giai cấp công nhân và nhân dân lao động", // đúng
          ],
          correct: 3,
          explanation:
            "Khác với nhà nước tư sản là công cụ thống trị của giai cấp tư sản, nhà nước XHCN là công cụ chuyên chính của giai cấp công nhân và nhân dân lao động.",
        },
        {
          question: "Bản chất của nhà nước xã hội chủ nghĩa là gì?",
          options: [
            "Bản chất giai cấp tư sản",
            "Bản chất giai cấp công nhân, đồng thời mang tính nhân dân rộng rãi và tính dân tộc sâu sắc", // đúng
            "Bản chất quân phiệt",
            "Bản chất phong kiến",
          ],
          correct: 1,
          explanation:
            "Nhà nước XHCN vừa mang bản chất giai cấp công nhân, vừa thể hiện tính nhân dân và tính dân tộc sâu sắc.",
        },
        {
          question: "Chức năng đối ngoại của nhà nước XHCN là gì?",
          options: [
            "Mở rộng quan hệ hợp tác quốc tế, bảo vệ Tổ quốc XHCN", // đúng
            "Xâm chiếm lãnh thổ các nước khác",
            "Khép kín không giao lưu",
            "Chỉ tập trung cho kinh tế trong nước",
          ],
          correct: 0,
          explanation:
            "Chức năng đối ngoại của nhà nước XHCN là mở rộng quan hệ hợp tác quốc tế, đồng thời bảo vệ Tổ quốc và chế độ XHCN.",
        },
        {
          question:
            "Dân chủ xã hội chủ nghĩa giữ vai trò gì đối với nhà nước XHCN?",
          options: [
            "Không có liên quan",
            "Chỉ phục vụ một nhóm nhỏ",
            "Chỉ là hình thức chính trị tạm thời",
            "Là bản chất và nền tảng để xây dựng nhà nước XHCN", // đúng
          ],
          correct: 3,
          explanation:
            "Dân chủ XHCN là bản chất, là nền tảng để xây dựng và phát huy vai trò của nhà nước XHCN.",
        },
      ],
    };
  }
};

// Generate image using AI description to search terms
export const generateImage = async (description: string): Promise<string> => {
  try {
    // First, generate search terms from the description
    const searchTerms = await generateImageSearchTerms(description);

    // Then get an image using those search terms
    return await getRandomImage(searchTerms);
  } catch (error) {
    console.error("Error generating image:", error);
    // Fallback to a default education image
    return "https://source.unsplash.com/800x400/?vietnam,culture,education";
  }
};

// Chat with AI assistant
export const chatWithAI = async (
  message: string,
  context?: string
): Promise<string> => {
  try {
    const contextPrompt = context
      ? `Bối cảnh: ${context}\n\nCâu hỏi của người dùng: ${message}`
      : message;

    const prompt = `Bạn là một trợ lý AI thông minh và hữu ích. Hãy trả lời câu hỏi sau một cách chi tiết và dễ hiểu:

${contextPrompt}

Hãy trả lời bằng tiếng Việt, thân thiện và cung cấp thông tin chính xác.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error chatting with AI:", error);
    return "Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này. Vui lòng thử lại sau.";
  }
};
