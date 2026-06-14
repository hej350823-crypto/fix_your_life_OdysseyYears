import { Language, TestProfile } from './types';
import { TEST_DATA } from './mock/testData';

type Copy = {
  app: {
    languageLabel: string;
    testMode: string;
    normalMode: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    scrollHint: string;
    eyebrow: string;
  };
  pain: {
    title: string;
    body1: string;
    body2: string;
    body3: string;
  };
  core: {
    steps: Array<{ title: string; desc: string }>;
  };
  resultDemo: {
    title: string;
    subtitle: string;
    badge: string;
    greeting: string;
    letter: string;
    delivered: string;
    futureEyebrow: string;
    futureTitle: string;
    futureBody: string;
    futureSealed: string;
    futureDelay: string;
  };
  footer: {
    title: string;
    placeholder: string;
    submit: string;
    copyright: string;
  };
  onboarding: {
    useTestProfile: string;
    testProfileReady: string;
    nameQuestion: string;
    namePlaceholder: string;
    enterHint: string;
    nameContinue: string;
    hello: string;
    painQuestion: string;
    continue: string;
    photoTitle: string;
    photoSubtitle: string;
    upload: string;
    useTestPhoto: string;
    skipPhoto: string;
    photoQuote: string;
    start: string;
    privacyNote: string;
    painPoints: string[];
  };
  chat: {
    exit: string;
    thinking: string;
    generating: string;
    generatingSub: string;
    visualize: string;
    choiceLead: string;
    placeholder: string;
    footer: string;
    quickResult: string;
    testBadge: string;
  };
  final: {
    hello: string;
    received: string;
    badge: string;
    salutation: string;
    save: string;
    restart: string;
    continue: string;
  };
  timeCapsule: {
    eyebrow: string;
    title: string;
    description: string;
    deliveryPreview: string;
    emailLabel: string;
    emailPlaceholder: string;
    delays: {
      oneMonth: string;
      threeMonths: string;
      sixMonths: string;
      oneYear: string;
    };
    submit: string;
    saving: string;
    saved: string;
    error: string;
    privacy: string;
  };
  test: {
    profile: TestProfile;
    finalLetter: string;
  };
};

export const copy: Record<Language, Copy> = {
  zh: {
    app: {
      languageLabel: '中文',
      testMode: '测试模式',
      normalMode: '正常模式',
    },
    hero: {
      title: 'Fix Your Life.',
      subtitle: '你只是暂时看不清方向。',
      description: '当人生还没有答案，先别急着逼自己靠岸。不是急着改造自己，而是重新校准方向。',
      cta: '开始穿过迷雾',
      scrollHint: '向下看看为什么',
      eyebrow: '第一束光',
    },
    pain: {
      title: '为什么越努力，越觉得没有方向？',
      body1: '有些阶段不是失败，也不是停滞。它更像一段漂流：你离开了旧的自己，却还没抵达新的生活。',
      body2: '这时候最需要的不是一句“加油”，而是一个可以重新看见方向的锚点。',
      body3: 'Fix Your Life 不急着替你解决人生。它先陪你看清：你正在离开什么，又想靠近什么。',
    },
    core: {
      steps: [
        {
          title: '命名你的迷雾',
          desc: '先说出你正在困住的地方：焦虑、拖延、空心、没有方向。被命名的迷雾，才有被穿过的可能。',
        },
        {
          title: '看见未来的岸',
          desc: '通过对话遇见那个已经走过这段时期的自己。不是逼自己更快，而是先看清要往哪里走。',
        },
        {
          title: '寄出一封未来信',
          desc: '把今天的困惑封存起来，让未来某一天的你重新打开，确认自己曾经从这里出发。',
        },
      ],
    },
    resultDemo: {
      title: '不只是一张未来画像。',
      subtitle: '它是你在迷雾里可以回头看的方向感。',
      badge: '未来的你',
      greeting: '写给现在的我：',
      letter: '我知道那时的你还看不清岸在哪里。但你没有停在原地，你从一个很小的早晨开始，慢慢把自己带回来了。',
      delivered: '以未来信件呈现',
      futureEyebrow: '寄给未来的我',
      futureTitle: '把今天的迷雾封存起来。',
      futureBody: '当你说完现在的困惑，Fix Your Life 也会替你整理一封写给未来的信。它不会立刻打开，而是在某个约定好的日子回到你手里。',
      futureSealed: '信件已封存',
      futureDelay: '可选择 1 个月、3 个月、6 个月或 1 年后送达',
    },
    footer: {
      title: '准备好看见未来的岸了吗？',
      placeholder: '输入你的名字，开始这段航行...',
      submit: '开始',
      copyright: '© 2026 Fix Your Life. 为个人成长重新设计入口。',
    },
    onboarding: {
      useTestProfile: '使用测试资料',
      testProfileReady: '已填入测试资料',
      nameQuestion: '先告诉我，应该怎么称呼正在穿过迷雾的你？',
      namePlaceholder: '你的名字',
      enterHint: '按 Enter，或继续往前走',
      nameContinue: '继续穿过迷雾',
      hello: '你好',
      painQuestion: '最近最让你觉得“我不知道该往哪里走”的是什么？',
      continue: '继续',
      photoTitle: '留下一张现在的你。',
      photoSubtitle: '我们只在本次体验中使用它，测试时也可以直接用模拟照片。',
      upload: '上传照片',
      useTestPhoto: '使用测试照片',
      skipPhoto: '跳过照片',
      photoQuote: '“画面可以模糊，但诚实会让方向变清楚。”',
      start: '开始对话',
      privacyNote: '测试模式不会调用真实 API，也不会上传图片。',
      painPoints: ['方向感消失', '对未来焦虑', '反复拖延', '不知道自己是谁', '很努力但没靠岸感', '想逃离现在', '空心感'],
    },
    chat: {
      exit: '退出',
      thinking: '思考中',
      generating: 'AI 正在根据你的回答描绘未来的岸...',
      generatingSub: '穿过迷雾中',
      visualize: '面对未来的理想自己',
      choiceLead: '先选一个最接近的入口',
      placeholder: '没有合适的？写下你的真实想法...',
      footer: '对话让方向慢慢显影',
      quickResult: '快速生成测试结果',
      testBadge: '测试模式',
    },
    final: {
      hello: '你好',
      received: '来自 {year} 年的讯息',
      badge: '未来的你',
      salutation: '写给过去的我：',
      save: '保存到日记',
      restart: '开始新一轮',
      continue: '寄给未来的 TA',
    },
    timeCapsule: {
      eyebrow: '未来邮局',
      title: '把今天的迷雾寄给未来。',
      description: 'AI 已经替你封好一封信。它不会现在打开，而会在未来某一天回到你手里，提醒你：你曾经从这里出发。',
      deliveryPreview: '这封信会在 {date} 回到你的邮箱。',
      emailLabel: '收信邮箱',
      emailPlaceholder: 'you@example.com',
      delays: {
        oneMonth: '1 个月后',
        threeMonths: '3 个月后',
        sixMonths: '6 个月后',
        oneYear: '1 年后',
      },
      submit: '寄给未来',
      saving: '正在封存',
      saved: '已经封存。当前为测试保存，接入邮件服务后会按时发送。',
      error: '暂时没能保存，请稍后再试。',
      privacy: '测试阶段会先保存为本地记录；上线后会加数据库、邮件服务和退订入口。',
    },
    test: {
      profile: TEST_DATA.zh.profile,
      finalLetter: TEST_DATA.zh.finalLetter,
    },
  },
  en: {
    app: {
      languageLabel: 'EN',
      testMode: 'Test mode',
      normalMode: 'Normal mode',
    },
    hero: {
      title: 'Fix Your Life.',
      subtitle: 'You just cannot see the direction yet.',
      description: 'When life has no clear answer, do not rush yourself to shore. This is not about fixing who you are. It is about recalibrating where you are going.',
      cta: 'Start Through the Fog',
      scrollHint: 'Scroll to understand why',
      eyebrow: 'The First Light',
    },
    pain: {
      title: 'Why does trying harder still feel directionless?',
      body1: 'Some seasons are not failure, and they are not simply being stuck. They feel more like drifting: you have left an old self, but have not arrived at a new life.',
      body2: 'What helps then is not another “try harder.” It is an anchor that lets you see direction again.',
      body3: 'Fix Your Life does not rush to solve your whole life. It first helps you notice what you are leaving, and what you are trying to move toward.',
    },
    core: {
      steps: [
        {
          title: 'Name the Fog',
          desc: 'Say what has been holding you: anxiety, delay, emptiness, no direction. A fog that has a name becomes something you can move through.',
        },
        {
          title: 'See the Shore',
          desc: 'Meet the self who has already crossed this season. Not to force yourself faster, but to see where you are trying to go.',
        },
        {
          title: 'Send a Future Letter',
          desc: 'Seal today’s questions and let a future version of you open them again, remembering where the journey began.',
        },
      ],
    },
    resultDemo: {
      title: 'More than a future portrait.',
      subtitle: 'A sense of direction you can return to when the fog comes back.',
      badge: 'The Future You',
      greeting: 'Dear Past Self,',
      letter: 'I know you could not see the shore back then. But you did not stay still. You began with one small morning, and slowly brought yourself home.',
      delivered: 'Delivered as a future letter',
      futureEyebrow: 'To Future You',
      futureTitle: "Seal today's fog for later.",
      futureBody: 'After you name what is happening now, Fix Your Life can shape it into a letter for your future self. It stays closed until the day you choose.',
      futureSealed: 'Letter sealed',
      futureDelay: 'Deliver in 1 month, 3 months, 6 months, or 1 year',
    },
    footer: {
      title: 'Ready to see the shore ahead?',
      placeholder: 'Enter your name, begin the crossing...',
      submit: 'Go',
      copyright: '© 2026 Fix Your Life. Redesigning the entry point to personal growth.',
    },
    onboarding: {
      useTestProfile: 'Use test profile',
      testProfileReady: 'Test profile loaded',
      nameQuestion: 'First, how should we address the person moving through the fog?',
      namePlaceholder: 'Your name',
      enterHint: 'Press Enter, or keep moving forward',
      nameContinue: 'Continue through the fog',
      hello: 'Hello',
      painQuestion: 'What most makes you feel “I do not know where to go next”?',
      continue: 'Continue',
      photoTitle: "Let's capture your current state.",
      photoSubtitle: 'It stays in this experience. In test mode, you can use a simulated photo.',
      upload: 'Upload photo',
      useTestPhoto: 'Use test photo',
      skipPhoto: 'Skip photo',
      photoQuote: '"The image may be blurred. Honesty brings clarity."',
      start: 'Start the Conversation',
      privacyNote: 'Test mode does not call the real API or upload images.',
      painPoints: ['Lost direction', 'Future anxiety', 'Repeated delay', 'Not knowing who I am', 'Trying hard but not arriving', 'Wanting to escape now', 'Feeling hollow'],
    },
    chat: {
      exit: 'Exit',
      thinking: 'Thinking',
      generating: 'AI is drawing the shore from your answers...',
      generatingSub: 'Crossing the fog',
      visualize: 'Meet your ideal future self',
      choiceLead: 'Start with the closest door',
      placeholder: 'Nothing fits? Write what feels true...',
      footer: 'Dialogue lets direction slowly appear',
      quickResult: 'Generate test result',
      testBadge: 'Test mode',
    },
    final: {
      hello: 'Hello',
      received: 'Message received from {year}',
      badge: 'The Future You',
      salutation: 'Dear Past Self,',
      save: 'Save to Journal',
      restart: 'Start New Cycle',
      continue: 'Send to Future You',
    },
    timeCapsule: {
      eyebrow: 'Future Mailbox',
      title: 'Send today’s fog into the future.',
      description: 'AI has sealed a letter for you. It will not open now. It will return on a future day, reminding you: this is where you began.',
      deliveryPreview: 'This letter will return to your inbox on {date}.',
      emailLabel: 'Delivery email',
      emailPlaceholder: 'you@example.com',
      delays: {
        oneMonth: 'In 1 month',
        threeMonths: 'In 3 months',
        sixMonths: 'In 6 months',
        oneYear: 'In 1 year',
      },
      submit: 'Send to the Future',
      saving: 'Sealing',
      saved: 'Sealed. This is stored as a test record for now; email delivery can be connected later.',
      error: 'Could not save it yet. Please try again later.',
      privacy: 'During testing this is saved locally. Before launch, add database storage, email delivery, and unsubscribe controls.',
    },
    test: {
      profile: TEST_DATA.en.profile,
      finalLetter: TEST_DATA.en.finalLetter,
    },
  },
};

export const t = (language: Language) => copy[language];
