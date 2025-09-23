import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import "./AIChatbot.css";
import { Bot, User, Trash2, Send, CornerDownLeft } from "lucide-react";

interface AIChatbotProps {
  isFloatingMode?: boolean;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isFloatingMode = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Khởi tạo tin nhắn chào mừng
    const welcomeMessage: ChatMessage = {
      id: "1",
      role: "assistant",
      content:
        'Xin chào! Tôi là trợ lý AI chuyên về Chủ nghĩa xã hội khoa học . Tôi có thể giúp bạn trả lời các câu hỏi liên quan đến bài học "Nhà nước xã hội chủ nghĩa". Hãy đặt câu hỏi cho tôi nhé!',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "Lỗi: Chưa cấu hình API key. Vui lòng liên hệ quản trị viên để cấu hình VITE_GEMINI_API_KEY trong file .env",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Tạo prompt hạn chế phạm vi trả lời cho Gemini
      const systemPrompt = `Bạn là một giáo sư chuyên Chủ nghĩa xã hội khoa học, đặc biệt am hiểu sâu sắc về chủ đề "Nhà nước xã hội chủ nghĩa". 

NHIỆM VỤ: Hãy trả lời chi tiết, đầy đủ và có chiều sâu về các câu hỏi liên quan đến:

1. 🏛️ Sự ra đời, bản chất, chức năng của nhà nước xã hội chủ nghĩa
2. 📖 Mối quan hệ giữa dân chủ xã hội chủ nghĩa và nhà nước xã hội chủ nghĩa
3. 👥 Cơ sở, nền tảng cho việc xây dựng và hoạt động của nhà nước xã hội chủ nghĩa
4. Công cụ quan trọng cho việc thực thi quyền làm chủ của nhân dân

YÊU CẦU TRาาỐI LỜI:
- Trả lời bằng tiếng Việt rõ ràng, dễ hiểu
- Cung cấp ví dụ cụ thể và trích dẫn nếu có thể
- Giải thích đầy đủ, chi tiết, có chiều sâu
- Sử dụng 300-800 từ cho một câu trả lời hoàn chỉnh
- Cấu trúc rõ ràng với các đầu mục nếu cần thiết

Nếu câu hỏi không liên quan đến chủ đề trên, hãy lịch sự giải thích và hướng dẫn người dùng quay về chủ đề chính.

Câu hỏi cần giải đáp: "${inputMessage}"

Hãy trả lời một cách thấu đáo và giáo dục!`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Xin lỗi, tôi không thể trả lời câu hỏi này.";

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);

      let errorMessage = "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.";

      if (error instanceof Error && error.message.includes("400")) {
        errorMessage =
          "API key không hợp lệ hoặc request không đúng định dạng. Vui lòng liên hệ quản trị viên.";
      } else if (error instanceof Error && error.message.includes("429")) {
        errorMessage =
          "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.";
      } else if (error instanceof Error && error.message.includes("403")) {
        errorMessage =
          "API key không hợp lệ hoặc không có quyền truy cập. Vui lòng liên hệ quản trị viên.";
      }

      const errorResponse: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content:
        "Cuộc trò chuyện đã được xóa. Hãy đặt câu hỏi mới về tư tưởng Hồ Chí Minh nhé!",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const suggestedQuestions = [
    "Nhà nước xã hội chủ nghĩa ra đời trong bối cảnh nào?",
    "Bản chất của nhà nước xã hội chủ nghĩa là gì?",
    "Chức năng chính của nhà nước xã hội chủ nghĩa là gì?",
    "Nhà nước xã hội chủ nghĩa có những đặc điểm gì nổi bật?",
    "Mối quan hệ giữa dân chủ xã hội chủ nghĩa và nhà nước xã hội chủ nghĩa là gì?",
    "Cơ sở để xây dựng nhà nước xã hội chủ nghĩa là gì?",
  ];

  return (
    <div
      className={`chatbot-container ${isFloatingMode ? "floating-mode" : ""}`}
    >
      {!isFloatingMode && (
        <div className="chatbot-header">
          <h1>
            <Bot size={24} />
            Trợ Lý AI - CHủ Nghĩa Xã Hội Khoa Học
          </h1>
          <div className="header-actions">
            <button className="clear-button" onClick={clearChat}>
              <Trash2 size={16} />
              Xóa Chat
            </button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === "assistant" ? (
                <Bot size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isFloatingMode && (
        <div className="suggested-questions">
          <h4>Câu hỏi gợi ý:</h4>
          <div className="suggestions-grid">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="suggestion-button"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input">
        {isFloatingMode && (
          <div className="floating-actions">
            <button
              className="floating-clear-button"
              onClick={clearChat}
              title="Xóa chat"
            >
              🗑️
            </button>
          </div>
        )}
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Đặt câu hỏi về tư tưởng Hồ Chí Minh..."
            rows={isFloatingMode ? 1 : 2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
            aria-label="Gửi"
          >
            {isLoading ? (
              <div className="typing-indicator-small"></div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        {!isFloatingMode && (
          <p className="input-hint">
            <CornerDownLeft
              size={12}
              style={{ display: "inline-block", marginRight: "4px" }}
            />
            Nhấn Enter để gửi, Shift+Enter để xuống dòng
          </p>
        )}
      </div>
    </div>
  );
};

export default AIChatbot;
