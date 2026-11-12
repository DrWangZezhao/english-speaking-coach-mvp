export const lessons = [
  {
    title: '第一次见面',
    subtitle: '把自我介绍说得自然一点',
    icon: '01',
    turns: [
      { prompt: 'Hi! I’m your speaking coach. What nickname should I use for you? You can make one up.', hint: 'You can call me ...', keywords: ['call me', 'i am', "i'm"] },
      { prompt: 'Nice to meet you! What do you like doing after school?', hint: 'I like ...', keywords: ['like', 'love', 'enjoy'] },
      { prompt: 'That sounds fun. Can you tell me one more thing about it?', hint: 'I ... because ...', keywords: ['because', 'and', 'it is', "it's"] }
    ]
  },
  {
    title: '咖啡馆点单',
    subtitle: '在真实场景里开口',
    icon: '02',
    turns: [
      { prompt: 'Welcome! What would you like to drink?', hint: 'I would like ...', keywords: ['would like', "i'd like", 'can i have'] },
      { prompt: 'Sure! Would you like it hot or cold?', hint: 'I would like it ...', keywords: ['hot', 'cold', 'iced'] },
      { prompt: 'Anything else for you today?', hint: 'No, thank you. / Yes, ...', keywords: ['thank', 'yes', 'no', 'please'] }
    ]
  },
  {
    title: '周末计划',
    subtitle: '练习未来时和追问',
    icon: '03',
    turns: [
      { prompt: 'What are you going to do this weekend?', hint: 'I am going to ...', keywords: ['going to', 'will', 'plan to'] },
      { prompt: 'Who are you going with?', hint: 'I am going with ...', keywords: ['with', 'alone', 'myself'] },
      { prompt: 'Why are you excited about it?', hint: 'Because ...', keywords: ['because', 'excited', 'fun'] }
    ]
  }
];

export function evaluateAnswer(answer, turn) {
  const normalized = String(answer ?? '').trim().toLowerCase();
  if (!normalized) return { ok: false, feedback: '先试着说一句英语。可以参考下方提示。' };
  if (normalized.length > 280) return { ok: false, feedback: '这次请用一两句简短英语回答。' };
  const words = normalized.match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  if (words.length < 3) return { ok: false, feedback: '已经开口啦！再试着说一个完整的英文句子。' };
  const matched = turn.keywords.some((keyword) => normalized.includes(keyword));
  return {
    ok: true,
    feedback: matched
      ? '说得很好！表达很自然。接下来试试下一句。'
      : '说出来就是进步！你也可以参考提示，换一种说法。我们继续。'
  };
}

export function currentTurn(lessonIndex, turnIndex) {
  return lessons[lessonIndex]?.turns[turnIndex] ?? null;
}
