export const TEST_DATA = {
  zh: {
    profile: {
      name: '小禾',
      painPoints: ['方向感消失', '对未来焦虑', '很努力但没靠岸感'],
      photo: '/test-assets/current-self.svg',
    },
    demoQuestions: [
      '我们先不急着解决人生。最近最让你觉得“我不知道要往哪走”的瞬间是什么？',
      '如果这种迷雾继续一年，你最不想看到自己变成什么样？',
      '反过来看，如果未来的你已经靠岸，TA 的生活会多出哪一种确定感？',
      '那个版本的你，一天里最小但最稳定的动作是什么？',
      '你觉得 TA 是先放下了什么，才慢慢走到那里的？',
      '未来的你回头看现在，会最心疼你哪一点？',
      'TA 会想提醒你，不要再把哪件事误认为失败？',
      '如果给未来的自己一个名字，它会是什么？',
      '你现在能为那个人留下的一个很小的信号是什么？',
      '最后，用一句话写下你想带着它继续往前走的方向。',
    ],
    finalLetter: '亲爱的小禾，我知道那时的你像漂在海上，既想靠岸，又不知道岸在哪里。但那不是失败，也不是退步。你只是正经过一段看不清路的时期。后来你开始把注意力从“我是不是不够好”收回来，慢慢问自己：“我到底想靠近什么？”就是从那个问题开始，雾一点点散开了。',
    timeCapsuleLetter: '小禾，如果你正在未来的某一天读到这封信，请先停一下，看看现在的你有没有比那时多一点方向感。写下这封信的那一天，你还在担心自己一直漂着、一直没靠岸，但你已经开始认真寻找出口。请告诉那时的自己：看不清路，不代表没有路。',
    fallbackLetter: (name) => `亲爱的 ${name}，\n\n我知道你现在还看不清岸在哪里。可这不代表你失败了，只代表你正经过一段还没有答案的时期。请先不要急着证明自己，先慢慢看清自己真正想靠近什么。\n\n我在未来，等你带着自己的节奏抵达。\n\n-- 未来的你`,
    fallbackTimeCapsuleLetter: (name) => `${name}，这是过去的你托我寄来的一封信。那时候你还不确定自己要往哪里走，但你已经愿意认真面对迷雾。请你回头看一眼，确认自己是不是已经比那时更靠近一点点岸边。`,
  },
  en: {
    profile: {
      name: 'Mia',
      painPoints: ['Lost direction', 'Future anxiety', 'Trying hard but not arriving'],
      photo: '/test-assets/current-self.svg',
    },
    demoQuestions: [
      'Let’s not rush to solve your whole life. What recent moment made you feel, “I do not know where to go next”?',
      'If this fog continued for a year, what version of yourself would you most hope to avoid?',
      'Now reverse it: if your future self has reached shore, what kind of certainty exists in their life?',
      'What is the smallest steady action in that person’s day?',
      'What did they have to release before they could get there?',
      'When your future self looks back, what would they feel most tender toward in you?',
      'What would they remind you not to mistake for failure?',
      'If you gave that future self a name, what would it be?',
      'What tiny signal can you leave for that person today?',
      'Finally, write one sentence about the direction you want to keep walking toward.',
    ],
    finalLetter: 'Dear Mia, I know you once felt like you were drifting, wanting to reach shore but not knowing where shore was. That was not failure, and it was not falling behind. You were moving through a season without clear answers. Later, you stopped asking whether you were enough and began asking what you were truly moving toward. That question was where the fog started to thin.',
    timeCapsuleLetter: 'Mia, if you are reading this in the future, pause for a moment and notice whether you feel a little closer to direction now. On the day this letter was sealed, you were afraid of drifting forever, but you had already begun looking for a way through. Please tell your past self: not seeing the path yet does not mean there is no path.',
    fallbackLetter: (name) => `Dear ${name},\n\nI know you cannot see the shore clearly right now. That does not mean you have failed. It means you are moving through a season that has not given you its answers yet. Do not rush to prove yourself. First, listen for what you are truly moving toward.\n\nI am waiting in the future, at your own pace.\n\n-- Your future self`,
    fallbackTimeCapsuleLetter: (name) => `${name}, this is a sealed letter from the version of you who did not yet know where to go, but was already willing to face the fog. Look back gently. Notice whether you are a little closer to shore now.`,
  },
};

export const getTestData = (language = 'zh') => TEST_DATA[language] || TEST_DATA.zh;
