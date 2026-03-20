export const renderingBaselines = {
  recordedAt: "2026-03-20",
  pages: {
    resourceAiCodingTip: {
      path: "resource-ai_coding_tip",
      mustContain: [
        '<div class="craft-callout"><p>🖥️ AI 코딩의 반은 설계</p>',
        "<li>AI 코딩 시 설계에 대부분의 노력을 투여하자</li>",
        "<li>환경, 재료, 구조, 방식을 정의</li>",
        "<li>설계에 따라 단계별로 개발-조립-검증</li>",
        '<div class="craft-block-group craft-block-group--depth-1"><p><img src="https://r.craft.do/',
      ],
      mustNotContain: [
        "<blockquote>",
      ],
    },
    reviewChatGpt: {
      path: "review-chat_gpt",
      mustContain: [
        "<h2>1. GPT 유료 구독이란?</h2>",
        '<div class="craft-block-group craft-block-group--depth-1"><h3>GPT의 유료 기능을 쓰려면 GPT Plus 구독이 필요</h3>',
        "<h2>2. 다른 AI 모델들과의 비교</h2>",
        "<h2>3. Chat GPT를 어떻게 업무에 적용해서 쓰는가?</h2>",
        "<h2>4. AI 유료 구독 의미 있을까?</h2>",
      ],
      mustNotContain: [
        "<ol>",
      ],
    },
  },
}
