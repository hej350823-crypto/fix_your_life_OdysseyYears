import { Language, TestProfile } from './types';
import { TEST_DATA } from './mock/testData';

type PainPointOption = {
  title: string;
  preview: string;
};

type PainPointGroup = {
  title: string;
  options: PainPointOption[];
};

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
    takePhoto: string;
    capturePhoto: string;
    closeCamera: string;
    cameraError: string;
    useTestPhoto: string;
    photoRequired: string;
    photoQuote: string;
    start: string;
    privacyNote: string;
    painLead: string;
    painHint: string;
    painSelectionCount: string;
    painPreviewDefaultTitle: string;
    painPreviewDefaultBody: string;
    painPointGroups: PainPointGroup[];
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
    saving: string;
    saveError: string;
    restart: string;
    restartConfirmTitle: string;
    restartConfirmBody: string;
    restartConfirmCancel: string;
    restartConfirmAction: string;
    continue: string;
  };
  timeCapsule: {
    eyebrow: string;
    previewNotice: string;
    title: string;
    description: string;
    deliveryPreview: string;
    emailLabel: string;
    emailPlaceholder: string;
      delays: {
        threeDays: string;
        oneWeek: string;
        twoWeeks: string;
        oneMonth: string;
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
    timeCapsuleLetter: string;
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
      subtitle: '你只是暂时看不清方向',
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
      takePhoto: '拍摄照片',
      capturePhoto: '使用这张',
      closeCamera: '关闭摄像头',
      cameraError: '无法打开摄像头，请检查浏览器权限，或改用上传照片。',
      useTestPhoto: '使用测试照片',
      photoRequired: '请先上传或拍摄照片，才能开始对话。',
      photoQuote: '“画面可以模糊，但诚实会让方向变清楚。”',
      start: '开始对话',
      privacyNote: '测试模式不会调用真实 API，也不会上传图片。',
      painLead: '哪些词，最接近你最近的状态？',
      painHint: '先不用选得很准确，把那些说中了你的词点下来就好。',
      painSelectionCount: '已选择 {count} 个',
      painPreviewDefaultTitle: '从一个最像你的入口开始',
      painPreviewDefaultBody: '把鼠标停在某个词上看看，或者直接点中它。我们会从你最有感觉的地方开始往下走。',
      painPointGroups: [
        {
          title: '自我与状态',
          options: [
            {
              title: '空心感',
              preview: '心里总是空落落的，好像没有什么真正让我想靠近。',
            },
            {
              title: '想逃离现在',
              preview: '每天都想离开现在的生活，可我也不知道还能去哪里。',
            },
            {
              title: '意义感流失',
              preview: '日子在照常往前走，但我越来越说不清这样活着是为了什么。',
            },
          ],
        },
        {
          title: '选择与未来',
          options: [
            {
              title: '无靠岸感',
              preview: '明明一直在努力，却始终没有那种真正落地、安心的感觉。',
            },
            {
              title: '决策瘫痪',
              preview: '站在人生的分岔口，越想选对，越不敢迈出下一步。',
            },
            {
              title: '方向迷失',
              preview: '眼前好像有很多条路，可我不知道哪一条才更像我自己的。',
            },
          ],
        },
        {
          title: '能量与行动',
          options: [
            {
              title: '拖延与自责',
              preview: '越拖越动不了，越动不了就越责怪自己。',
            },
            {
              title: '精神低电量',
              preview: '我不是不想开始，只是真的像一点力气都没有了。',
            },
            {
              title: '试错疲惫',
              preview: '试过一些可能，却一次次失望，现在连再试一次都觉得累。',
            },
          ],
        },
        {
          title: '关系与外界',
          options: [
            {
              title: '同辈压力',
              preview: '别人好像都在往前走，只有我还停在原地找不到节奏。',
            },
            {
              title: '不被理解',
              preview: '我很想把心里的困惑说清楚，但总觉得没人真的听懂。',
            },
            {
              title: '迎合期待',
              preview: '我一直在努力成为别人希望的样子，却越来越看不见自己。',
            },
          ],
        },
      ],
    },
    chat: {
      exit: '退出',
      thinking: '思考中',
      generating: '未来理想的你有些话想对现在迷茫的你说……',
      generatingSub: '正在穿过迷雾',
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
      saving: '正在保存',
      saveError: '保存失败，请稍后再试。',
      restart: '开始新一轮',
      restartConfirmTitle: '确定要开始新一轮吗？',
      restartConfirmBody: '如果还没有保存，这次对话和来自未来的信都会离开当前页面。',
      restartConfirmCancel: '先留下',
      restartConfirmAction: '确定开始',
      continue: '寄给未来的 TA',
    },
    timeCapsule: {
      eyebrow: '未来邮局',
      previewNotice: '时间胶囊邮箱发送功能暂未开放，后续版本会支持寄送到未来的自己。',
      title: '将今天的迷茫收藏，寄给未来改变后的你',
      description: '填好邮箱后，我们会把今天的信和画像一起封存起来。它们不会现在打开，而会在未来某一天回到你手里，提醒你：你曾经从这里出发。',
      deliveryPreview: '这封信和今天的画像会在 {date} 回到你的邮箱。',
      emailLabel: '收信邮箱',
      emailPlaceholder: 'you@example.com',
      delays: {
        threeDays: '3 天后',
        oneWeek: '7 天后',
        twoWeeks: '14 天后',
        oneMonth: '30 天后',
      },
      submit: '寄给未来',
      saving: '正在生成并封存',
      saved: '已经封存。邮件已预约，会按你选的日期自动发出。',
      error: '暂时没能预约发送，请稍后再试。',
      privacy: '当前版本使用 Resend 定时发送，最长支持预约 30 天内的邮件。',
    },
    test: {
      profile: TEST_DATA.zh.profile,
      finalLetter: TEST_DATA.zh.finalLetter,
      timeCapsuleLetter: TEST_DATA.zh.timeCapsuleLetter,
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
      takePhoto: 'Take photo',
      capturePhoto: 'Use this photo',
      closeCamera: 'Close camera',
      cameraError: 'Could not open the camera. Please check browser permissions or upload a photo instead.',
      useTestPhoto: 'Use test photo',
      photoRequired: 'Please upload or take a photo before starting the conversation.',
      photoQuote: '"The image may be blurred. Honesty brings clarity."',
      start: 'Start the Conversation',
      privacyNote: 'Test mode does not call the real API or upload images.',
      painLead: 'Which phrases feel closest to your current state?',
      painHint: 'It does not need to be perfect. Just click the phrases that feel true.',
      painSelectionCount: 'Selected {count}',
      painPreviewDefaultTitle: 'Start from the doorway that feels most familiar',
      painPreviewDefaultBody: 'Hover over a phrase to preview it, or tap one to keep it in focus. We will begin from what feels most true.',
      painPointGroups: [
        {
          title: 'Self and inner state',
          options: [
            {
              title: 'Feeling hollow',
              preview: 'There is an emptiness in me, like nothing feels truly alive or worth moving toward.',
            },
            {
              title: 'Wanting to escape now',
              preview: 'I keep wanting to leave my current life, but I do not know where else I could go.',
            },
            {
              title: 'Losing meaning',
              preview: 'Life keeps moving, but I am less and less sure what any of it is for.',
            },
          ],
        },
        {
          title: 'Choice and future',
          options: [
            {
              title: 'Not arriving anywhere',
              preview: 'I keep trying, but I still cannot find the feeling of truly landing somewhere solid.',
            },
            {
              title: 'Decision paralysis',
              preview: 'I am stuck at a fork in the road, so afraid of choosing wrong that I barely move.',
            },
            {
              title: 'Losing direction',
              preview: 'There seem to be many possible roads, but none of them clearly feels like mine.',
            },
          ],
        },
        {
          title: 'Energy and action',
          options: [
            {
              title: 'Delay and self-blame',
              preview: 'The more I delay, the harder it is to act. The harder it is to act, the more I turn on myself.',
            },
            {
              title: 'Low mental battery',
              preview: 'It is not that I do not want to begin. I just feel like I have no energy left.',
            },
            {
              title: 'Tired of trying',
              preview: 'I have tested different possibilities and mostly found disappointment. I am tired of trying again.',
            },
          ],
        },
        {
          title: 'Others and the world',
          options: [
            {
              title: 'Peer pressure',
              preview: 'Everyone around me seems to be moving forward, and I feel left behind.',
            },
            {
              title: 'Not understood',
              preview: 'I want to explain what hurts, but it feels like no one really gets it.',
            },
            {
              title: 'Living by expectations',
              preview: 'I keep trying to become what others expect, and I can feel myself fading out of the picture.',
            },
          ],
        },
      ],
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
      saving: 'Saving',
      saveError: 'Could not save the image. Please try again.',
      restart: 'Start New Cycle',
      restartConfirmTitle: 'Start a new cycle?',
      restartConfirmBody: 'If you have not saved this yet, the conversation and future letter will leave this page.',
      restartConfirmCancel: 'Stay here',
      restartConfirmAction: 'Start new cycle',
      continue: 'Send to Future You',
    },
    timeCapsule: {
      eyebrow: 'Future Mailbox',
      previewNotice: 'Time-capsule email delivery is not live yet. A future release will let you send this to your future self.',
      title: 'Save today’s uncertainty for the future you who has changed.',
      description: 'After you enter your email, we will seal today’s letter and portrait together. They will return on a future day, reminding you: this is where you began.',
      deliveryPreview: 'This letter and present portrait will return to your inbox on {date}.',
      emailLabel: 'Delivery email',
      emailPlaceholder: 'you@example.com',
      delays: {
        threeDays: 'In 3 days',
        oneWeek: 'In 7 days',
        twoWeeks: 'In 14 days',
        oneMonth: 'In 30 days',
      },
      submit: 'Send to the Future',
      saving: 'Generating and sealing',
      saved: 'Sealed. Your email has been scheduled and will send automatically on that date.',
      error: 'Could not schedule it yet. Please try again later.',
      privacy: 'This version uses Resend scheduled email and currently supports delivery within 30 days.',
    },
    test: {
      profile: TEST_DATA.en.profile,
      finalLetter: TEST_DATA.en.finalLetter,
      timeCapsuleLetter: TEST_DATA.en.timeCapsuleLetter,
    },
  },
};

export const t = (language: Language) => copy[language];
