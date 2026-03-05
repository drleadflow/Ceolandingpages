import type { ComponentConfig } from "@puckeditor/core";

export type QuizBlockProps = {
  questionId: string;
  question: string;
  options: string;
  allowMultiple: boolean;
  showImages: boolean;
};

export const QuizBlock: ComponentConfig<QuizBlockProps> = {
  label: "Quiz Question",
  fields: {
    questionId: { type: "text", label: "Question ID (for routing)" },
    question: { type: "textarea", label: "Question Text" },
    options: { type: "textarea", label: "Answer Options (one per line)" },
    allowMultiple: {
      type: "radio",
      label: "Allow Multiple",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showImages: {
      type: "radio",
      label: "Card Style",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  defaultProps: {
    questionId: "q1",
    question: "What's your biggest challenge?",
    options: "Getting more leads\nClosing more deals\nRetaining clients\nScaling operations",
    allowMultiple: false,
    showImages: true,
  },
  render: ({ question, options, allowMultiple, showImages }) => {
    const optionList = options.split("\n").filter((o) => o.trim());
    const inputType = allowMultiple ? "checkbox" : "radio";

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white text-center">{question}</h3>
        <div className={showImages ? "grid grid-cols-2 gap-3" : "space-y-2"}>
          {optionList.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 cursor-pointer transition-all ${
                showImages
                  ? "flex-col justify-center p-5 bg-white/5 border-2 border-white/10 rounded-xl hover:border-[#E5C158]/50 hover:bg-[#E5C158]/5 text-center min-h-[80px]"
                  : "px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
              }`}
            >
              <input
                type={inputType}
                name="quiz-answer"
                value={opt}
                className={showImages ? "sr-only peer" : "accent-[#E5C158]"}
              />
              <span className="text-white/90 peer-checked:text-[#E5C158] font-medium">
                {opt}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  },
};
