export const TEST_DATA = {
  zh: {
    profile: {
      name: '林夏',
      painPoints: ['无靠岸感', '精神低电量', '不被理解'],
      photo: '/test-assets/test-source.png',
    },
    demoQuestions: [
      '我们先不急着解决人生。最近最让你觉得“我不知道要往哪走”的瞬间是什么？',
      '这团迷雾里，最消耗你的部分是什么？',
      '如果这个痛苦在提醒你一件很在乎的事，那可能是什么？',
      '如果未来有一个更稳的你，TA 身上最让你安心的特质是什么？',
      '那个更稳的你，普通一天里会多出什么支持 TA 的东西？',
      '今天你可以留下一个什么小信号，证明你正在靠近那个自己？',
    ],
    finalLetter: '亲爱的林夏，我记得那时的你总像坐在窗边发呆，明明很想往前，却连下一步该落在哪里都不确定。但那不是退步，只是你正在经过一段雾还没散开的时期。后来你没有再逼自己立刻变得厉害，而是慢慢学会分辨：什么让你更安稳，什么其实只是让你更耗电。就是从那一点点分辨开始，方向感重新回来了。',
    timeCapsuleLetter: '林夏，如果你在未来某个普通的早晨读到这封信，我想先问问你：现在的你，是不是比写下这封信的那天更安稳一点了？那时的你还会怀疑自己是不是一直都找不到岸，但你已经开始认真辨认内心真正想靠近的生活。请告诉今天的我，雾没有一下散开也没关系，只要你还在慢慢往亮的地方走。',
    fallbackLetter: (name) => `亲爱的 ${name}，\n\n我知道你现在还看不清岸在哪里。可这不代表你失败了，只代表你正经过一段还没有答案的时期。请先不要急着证明自己，先慢慢看清自己真正想靠近什么。\n\n我在未来，等你带着自己的节奏抵达。\n\n-- 未来的你`,
    fallbackTimeCapsuleLetter: (name) => `${name}，这是过去的你托我寄来的一封信。那时候你还不确定自己要往哪里走，但你已经愿意认真面对迷雾。请你回头看一眼，确认自己是不是已经比那时更靠近一点点岸边。`,
  },
  en: {
    profile: {
      name: 'Lina',
      painPoints: ['Not arriving anywhere', 'Low mental battery', 'Not understood'],
      photo: '/test-assets/test-source.png',
    },
    demoQuestions: [
      'Let’s not rush to solve your whole life. What recent moment made you feel, “I do not know where to go next”?',
      'Inside this fog, what part has been draining you the most?',
      'If this pain is pointing toward something you deeply care about, what might that be?',
      'If there is a steadier future version of you, what quality in them would feel most reassuring?',
      'In an ordinary day, what kind of support would that steadier version of you have around them?',
      'What tiny signal could you leave today to show you are moving toward that self?',
    ],
    finalLetter: 'Dear Lina, I remember the version of you who sat quietly with too many tabs open in her mind, wanting to move forward but not knowing where to place the next step. That was not failure. It was a season before the fog had cleared. Things shifted when you stopped demanding certainty from yourself and started noticing what made you feel steadier, warmer, and more alive. That was where direction slowly returned.',
    timeCapsuleLetter: 'Lina, if you are opening this on an ordinary morning in the future, tell me first: do you feel even a little more grounded now than you did when this was written? Back then you were scared of drifting forever, but you had already started listening more carefully to the life you actually wanted to move toward. Please tell your past self that the fog did not need to vanish all at once for the path to begin appearing.',
    fallbackLetter: (name) => `Dear ${name},\n\nI know you cannot see the shore clearly right now. That does not mean you have failed. It means you are moving through a season that has not given you its answers yet. Do not rush to prove yourself. First, listen for what you are truly moving toward.\n\nI am waiting in the future, at your own pace.\n\n-- Your future self`,
    fallbackTimeCapsuleLetter: (name) => `${name}, this is a sealed letter from the version of you who did not yet know where to go, but was already willing to face the fog. Look back gently. Notice whether you are a little closer to shore now.`,
  },
};

export const getTestData = (language = 'zh') => TEST_DATA[language] || TEST_DATA.zh;
