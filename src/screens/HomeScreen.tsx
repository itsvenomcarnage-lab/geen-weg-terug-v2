import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LezenStackParamList, TabParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT;

const TAGLINE =
  'Sommige deuren openen niet naar buiten, maar naar beneden.';

const ENVELOPE_REVEAL_IMAGES = {
  open: require('../../assets/images/cctv-vrouw.jpg'),
  discard: require('../../assets/images/cctv-valentino.jpg'),
} as const;

const ENVELOPE_FOLLOW_UP_AUDIO = {
  open: require('../../assets/audio/crying.mp3'),
  discard: require('../../assets/audio/breathing.mp3'),
} as const;

const ENVELOPE_RESPONSES = {
  open: 'Je wilde weten wat erin zat. Dat is hoe het altijd begint.',
  discard: 'Je kunt hem weggooien. Maar hij vond jou al.',
} as const;

const CHARACTERS = [
  { name: 'Aidyn Elias', tagline: 'Ziet te veel. Stopt te laat.' },
  { name: 'Valentino Garcia', tagline: 'De duivel glimlacht beleefd.' },
  { name: 'Vanessa Jones', tagline: 'Kijkt niet weg, ook niet als het pijn doet.' },
  { name: 'Henry Becker', tagline: 'Bang, loyaal, en daarom gevaarlijker dan hij lijkt.' },
  { name: 'Danny Wilson', tagline: 'Spreekt weinig. Onthoudt alles.' },
  { name: 'Isabel', tagline: 'Weet meer dan ze laat zien.' },
  { name: 'Omar Elias', tagline: 'Beschermt wat hij al verloren heeft.' },
  { name: 'Roos Meijer', tagline: 'Gelooft in regels. Tot ze dat niet meer doet.' },
] as const;

type HomeNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<LezenStackParamList, 'Home'>,
  BottomTabNavigationProp<TabParamList>
>;

type EnvelopeChoice = 'open' | 'discard' | null;

// ─── Main screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavigation>();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [envelopeChoice, setEnvelopeChoice] = useState<EnvelopeChoice>(null);
  const [envelopeY, setEnvelopeY] = useState(0);
  const [ambientAudioEnabled, setAmbientAudioEnabled] = useState(false);
  const ambientSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    async function loadAmbient() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/ambient.mp3'),
          { isLooping: true, volume: 0.35, shouldPlay: false },
        );
        if (mounted) {
          ambientSound.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        // Audio file may be missing or unsupported on platform
      }
    }

    void loadAmbient();

    return () => {
      mounted = false;
      void ambientSound.current?.stopAsync();
      void ambientSound.current?.unloadAsync();
      ambientSound.current = null;
    };
  }, []);

  useEffect(() => {
    async function syncAmbientAudio() {
      try {
        if (!ambientSound.current) return;

        if (ambientAudioEnabled) {
          await ambientSound.current.playAsync();
        } else {
          await ambientSound.current.pauseAsync();
        }
      } catch {
        // Playback may fail on some platforms
      }
    }

    void syncAmbientAudio();
  }, [ambientAudioEnabled]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setAmbientAudioEnabled(false);
        void ambientSound.current?.pauseAsync();
        void ambientSound.current?.stopAsync();
      };
    }, []),
  );

  const hapticPress = useCallback((action: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  }, []);

  const scrollToEnvelope = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(envelopeY - spacing.lg, 0), animated: true });
  }, [envelopeY]);

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollY.setValue(event.nativeEvent.contentOffset.y);
        }}
      >
        <HeroSection
          topInset={insets.top}
          onEnter={() => hapticPress(() => navigation.navigate('Chapters'))}
          onOpenEnvelope={() => hapticPress(scrollToEnvelope)}
        />

        <ScrollReveal scrollY={scrollY} onLayoutY={setEnvelopeY}>
          <EnvelopeSection
            choice={envelopeChoice}
            onOpen={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setEnvelopeChoice('open');
            }}
            onDiscard={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setEnvelopeChoice('discard');
            }}
          />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <AidynSection />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <TeasersSection
            onQuiz={() => hapticPress(() => navigation.navigate('Quiz'))}
            onDossier={() => hapticPress(() => navigation.navigate('Dossier'))}
            onChapters={() => hapticPress(() => navigation.navigate('Chapters'))}
          />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <CharacterCardsSection />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <CasaRojaSection
            onFindEntrance={() => hapticPress(() => navigation.navigate('Chapters'))}
          />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <QuoteSection scrollY={scrollY} />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY}>
          <UnknownNumberSection scrollY={scrollY} />
        </ScrollReveal>

        <ScrollReveal scrollY={scrollY} style={styles.lastSection}>
          <DescentSection scrollY={scrollY} />
        </ScrollReveal>
      </ScrollView>

      <Pressable
        style={[styles.audioToggle, { bottom: insets.bottom + 88 }]}
        onPress={() => {
          void Haptics.selectionAsync();
          setAmbientAudioEnabled((prev) => !prev);
        }}
      >
        <Text style={styles.audioToggleIcon}>{ambientAudioEnabled ? '🔊' : '🔇'}</Text>
      </Pressable>
    </View>
  );
}

// ─── Animation utilities ────────────────────────────────────────────────────

function useLoopPulse(min: number, max: number, duration = 3000) {
  const value = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, max, min, value]);
  return value;
}

function useTypewriter(text: string, delayMs = 1000, speedMs = 50) {
  const [output, setOutput] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i += 1;
        setOutput(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speedMs);
    }, delayMs);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [delayMs, speedMs, text]);
  return { output, done };
}

interface ScrollRevealProps {
  scrollY: Animated.Value;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onLayoutY?: (y: number) => void;
}

function ScrollReveal({ scrollY, children, style, onLayoutY }: ScrollRevealProps) {
  const [y, setY] = useState(HERO_HEIGHT);
  const opacity = scrollY.interpolate({
    inputRange: [y - SCREEN_HEIGHT * 0.85, y - SCREEN_HEIGHT * 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const translateY = scrollY.interpolate({
    inputRange: [y - SCREEN_HEIGHT * 0.85, y - SCREEN_HEIGHT * 0.5],
    outputRange: [40, 0],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View
      style={[styles.section, style, { opacity, transform: [{ translateY }] }]}
      onLayout={(e) => {
        const layoutY = e.nativeEvent.layout.y;
        setY(layoutY);
        onLayoutY?.(layoutY);
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroBreathingOverlay() {
  const breathOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathOpacity, {
          toValue: 0.15,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(breathOpacity, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [breathOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.heroBreathOverlay, { opacity: breathOpacity }]}
    />
  );
}

interface HeroSectionProps {
  topInset: number;
  onEnter: () => void;
  onOpenEnvelope: () => void;
}

function HeroSection({ onEnter, onOpenEnvelope }: HeroSectionProps) {
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const redGlow = useRef(new Animated.Value(0)).current;
  const scrollArrowY = useRef(new Animated.Value(0)).current;
  const [typedTagline, setTypedTagline] = useState('');

  useEffect(() => {
    Animated.timing(labelOpacity, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 1000,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(lineWidth, {
      toValue: 80,
      duration: 600,
      delay: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(subOpacity, {
      toValue: 1,
      duration: 800,
      delay: 3500,
      useNativeDriver: true,
    }).start();

    Animated.timing(buttonsOpacity, {
      toValue: 1,
      duration: 800,
      delay: 4000,
      useNativeDriver: true,
    }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(redGlow, {
          toValue: 0.15,
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(redGlow, {
          toValue: 0,
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    glowLoop.start();

    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollArrowY, {
          toValue: 8,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scrollArrowY, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    arrowLoop.start();

    let typeInterval: ReturnType<typeof setInterval> | undefined;
    const typeTimeout = setTimeout(() => {
      let index = 0;
      typeInterval = setInterval(() => {
        index += 1;
        setTypedTagline(TAGLINE.slice(0, index));
        if (index >= TAGLINE.length && typeInterval) {
          clearInterval(typeInterval);
        }
      }, 45);
    }, 1000);

    return () => {
      glowLoop.stop();
      arrowLoop.stop();
      clearTimeout(typeTimeout);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, [
    buttonsOpacity,
    labelOpacity,
    lineWidth,
    redGlow,
    scrollArrowY,
    subOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <View style={[styles.hero, { height: SCREEN_HEIGHT }]}>
      <Video
        source={require('../../assets/videos/hero-bg.mp4')}
        style={styles.heroVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.heroRedGlow, { opacity: redGlow }]}
      />

      <HeroBreathingOverlay />

      <View style={styles.heroContent}>
        <AnimatedText style={[styles.heroLabel, { opacity: labelOpacity }]}>
          Ze weten dat je kijkt.
        </AnimatedText>

        <AnimatedText
          style={[
            styles.heroTitle,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Geen Weg Terug
        </AnimatedText>

        <Animated.View style={[styles.heroNeonLine, { width: lineWidth }]} />

        <Text style={styles.heroTagline}>{typedTagline}</Text>

        <Animated.Text style={[styles.heroSub, { opacity: subOpacity }]}>
          Niet elke deur heeft een uitgang.
        </Animated.Text>

        <Animated.View style={[styles.heroBtns, { opacity: buttonsOpacity }]}>
          <Pressable
            style={({ pressed }) => [styles.heroBtnPrimary, pressed && styles.btnPressed]}
            onPress={onEnter}
          >
            <Text style={styles.heroBtnPrimaryText}>Stap naar binnen</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.heroBtnOutline, pressed && styles.btnPressed]}
            onPress={onOpenEnvelope}
          >
            <Text style={styles.heroBtnOutlineText}>Open de envelop</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.Text
        style={[styles.heroScrollIndicator, { transform: [{ translateY: scrollArrowY }] }]}
      >
        ↓
      </Animated.Text>
    </View>
  );
}

// ─── Section 2: Envelope ────────────────────────────────────────────────────

interface EnvelopeSectionProps {
  choice: EnvelopeChoice;
  onOpen: () => void;
  onDiscard: () => void;
}

async function playEnvelopeSound() {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(require('../../assets/audio/envelope.mp3'));
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    // Audio may be missing or unsupported on platform
  }
}

async function playOneShotAudio(source: number) {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(source);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    // Audio may be missing or unsupported on platform
  }
}

async function playShutterSound(activeSounds: { current: Audio.Sound[] }) {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(require('../../assets/audio/tv-static.mp3'));
    activeSounds.current.push(sound);
    await sound.playAsync();
    setTimeout(() => {
      void sound.stopAsync();
      void sound.unloadAsync();
      activeSounds.current = activeSounds.current.filter((item) => item !== sound);
    }, 180);
  } catch {
    // Audio may be missing or unsupported on platform
  }
}

const ENVELOPE_FLITS = [
  require('../../assets/images/flits-1-garderobe.jpg'),
  require('../../assets/images/flits-2-prikbord.jpg'),
  require('../../assets/images/flits-3-bloed.jpg'),
  require('../../assets/images/flits-4-dossier.jpg'),
  require('../../assets/images/flits-5-privekamer.jpg'),
] as const;

const FLITS_DURATION_MS = 450;

function EnvelopeOpenReveal() {
  const navigation = useNavigation<HomeNavigation>();
  const envelopeScale = useRef(new Animated.Value(1)).current;
  const responseOpacity = useRef(new Animated.Value(0)).current;
  const chapterBtnOpacity = useRef(new Animated.Value(0)).current;
  const activeSounds = useRef<Audio.Sound[]>([]);
  const [phase, setPhase] = useState<'envelope' | 'flits' | 'black'>('envelope');
  const [flitsIndex, setFlitsIndex] = useState(0);
  const sequenceStarted = useRef(false);

  const cleanupAudio = useCallback(async () => {
    const sounds = [...activeSounds.current];
    activeSounds.current = [];
    await Promise.all(
      sounds.map(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {
          // Cleanup may fail if playback never started
        }
      }),
    );
  }, []);

  useEffect(() => {
    void playEnvelopeSound();
    Animated.timing(envelopeScale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPhase('flits');
    });
  }, [envelopeScale]);

  useEffect(() => {
    if (phase !== 'flits' || sequenceStarted.current) return;
    sequenceStarted.current = true;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    setFlitsIndex(0);

    for (let index = 1; index < ENVELOPE_FLITS.length; index += 1) {
      const delay = index * FLITS_DURATION_MS;
      timeouts.push(
        setTimeout(() => {
          void playShutterSound(activeSounds);
          setFlitsIndex(index);
        }, delay),
      );
    }

    timeouts.push(
      setTimeout(() => {
        setPhase('black');
      }, ENVELOPE_FLITS.length * FLITS_DURATION_MS),
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'black') return;

    const fadeTimeout = setTimeout(() => {
      Animated.timing(responseOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(chapterBtnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 0);

    return () => clearTimeout(fadeTimeout);
  }, [chapterBtnOpacity, phase, responseOpacity]);

  useEffect(() => {
    const handleBlur = () => {
      void cleanupAudio();
    };

    const unsubscribe = navigation.addListener('blur', handleBlur);

    return () => {
      unsubscribe();
      void cleanupAudio();
    };
  }, [cleanupAudio, navigation]);

  if (phase === 'envelope') {
    return (
      <Animated.View
        style={[styles.openRevealEnvelopeWrap, { transform: [{ scale: envelopeScale }] }]}
      >
        <StyledEnvelope />
      </Animated.View>
    );
  }

  return (
    <View style={styles.openRevealContainer}>
      {phase === 'flits' ? (
        <Image
          source={ENVELOPE_FLITS[flitsIndex]}
          style={styles.openRevealImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.openRevealBlack} />
      )}

      {phase === 'black' ? (
        <View style={styles.openRevealOverlayContent} pointerEvents="box-none">
          <Animated.Text style={[styles.openRevealOverlayText, { opacity: responseOpacity }]}>
            {ENVELOPE_RESPONSES.open}
          </Animated.Text>
          <Animated.View style={[styles.openRevealOverlayBtnWrap, { opacity: chapterBtnOpacity }]}>
            <Pressable
              style={({ pressed }) => [styles.openRevealOverlayBtn, pressed && styles.btnPressed]}
              onPress={() =>
                navigation.navigate('Reading', { chapterId: '1', bookId: 'geen-weg-terug' })
              }
            >
              <Text style={styles.envelopeChapterBtnText}>Lees hoofdstuk 1</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

interface StyledEnvelopeProps {
  pulseSeal?: boolean;
}

function StyledEnvelope({ pulseSeal = false }: StyledEnvelopeProps) {
  const sealOpacity = useRef(new Animated.Value(0.6)).current;
  const sealScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulseSeal) return;

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sealOpacity, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sealOpacity, {
            toValue: 0.6,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(sealScale, {
            toValue: 1.15,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sealScale, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulseSeal, sealOpacity, sealScale]);

  return (
    <View style={styles.envelopeVisual}>
      <View style={styles.envelopeFlapContainer}>
        <View style={styles.envelopeFlap} />
      </View>
      <View style={styles.envelopeBody}>
        {pulseSeal ? (
          <Animated.View
            style={[
              styles.envelopeSeal,
              { opacity: sealOpacity, transform: [{ scale: sealScale }] },
            ]}
          />
        ) : (
          <View style={styles.envelopeSeal} />
        )}
      </View>
    </View>
  );
}

function EnvelopeSection({ choice, onOpen, onDiscard }: EnvelopeSectionProps) {
  const navigation = useNavigation<HomeNavigation>();
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    void Asset.loadAsync([
      ...ENVELOPE_FLITS,
      ENVELOPE_REVEAL_IMAGES.open,
      ENVELOPE_REVEAL_IMAGES.discard,
    ]).finally(() => setAssetsReady(true));
  }, []);

  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryTranslateY = useRef(new Animated.Value(20)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const envelopeOpacity = useRef(new Animated.Value(1)).current;
  const envelopeTranslateX = useRef(new Animated.Value(0)).current;
  const envelopeRotate = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const responseOpacity = useRef(new Animated.Value(0)).current;
  const chapterBtnOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimatedChoice = useRef(false);

  const envRotate = envelopeRotate.interpolate({
    inputRange: [0, 20],
    outputRange: ['0deg', '20deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(entryTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryTranslateY]);

  useEffect(() => {
    if (choice) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shakeX, {
          toValue: -3,
          duration: 667,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 3,
          duration: 667,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -3,
          duration: 666,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [choice, shakeX]);

  useEffect(() => {
    if (!choice || choice === 'open' || hasAnimatedChoice.current) return;
    hasAnimatedChoice.current = true;

    const revealOutcome = (followUpAudio: number) => {
      void playOneShotAudio(followUpAudio);
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(responseOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(chapterBtnOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      });
    };

    void playEnvelopeSound();
    Animated.parallel([
      Animated.timing(envelopeTranslateX, {
        toValue: 400,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(envelopeRotate, {
        toValue: 20,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => revealOutcome(ENVELOPE_FOLLOW_UP_AUDIO.discard));
  }, [
    chapterBtnOpacity,
    choice,
    envelopeRotate,
    envelopeTranslateX,
    imageOpacity,
    responseOpacity,
  ]);

  return (
    <View style={styles.envelopeCard}>
      <Text style={styles.envelopeIntroLine1}>
        Een envelop. Geen naam. Geen afzender.
      </Text>
      <Text style={styles.envelopeIntroLine2}>Wat doe je?</Text>

      {choice !== 'open' ? (
        <Animated.View
          style={{
            transform: [{ translateX: choice ? 0 : shakeX }],
            marginVertical: spacing.lg,
          }}
        >
          <Animated.View
            style={{
              opacity: Animated.multiply(entryOpacity, envelopeOpacity),
              transform: [
                { translateY: entryTranslateY },
                { translateX: envelopeTranslateX },
                { rotate: envRotate },
              ],
            }}
          >
            <StyledEnvelope pulseSeal={choice === null} />
          </Animated.View>
        </Animated.View>
      ) : null}

      {choice === 'open' ? <EnvelopeOpenReveal /> : null}

      {choice === null ? (
        <View style={styles.envelopeBtns}>
          <Pressable
            style={({ pressed }) => [styles.envelopeBtnOpen, pressed && styles.btnPressed, !assetsReady && { opacity: 0.4 }]}
            onPress={assetsReady ? onOpen : undefined}
          >
            <Text style={styles.envelopeBtnOpenText}>{assetsReady ? 'Ik open hem' : 'Laden…'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.envelopeBtnDiscard, pressed && styles.btnPressed, !assetsReady && { opacity: 0.4 }]}
            onPress={assetsReady ? onDiscard : undefined}
          >
            <Text style={styles.envelopeBtnDiscardText}>Ik gooi hem weg</Text>
          </Pressable>
        </View>
      ) : null}

      {choice === 'discard' ? (
        <>
          <Animated.Image
            source={ENVELOPE_REVEAL_IMAGES.discard}
            style={[styles.envelopeRevealImage, { opacity: imageOpacity }]}
            resizeMode="cover"
          />
          <Animated.Text style={[styles.envelopeResponse, { opacity: responseOpacity }]}>
            {ENVELOPE_RESPONSES.discard}
          </Animated.Text>
          <Animated.View style={[styles.envelopeChapterWrap, { opacity: chapterBtnOpacity }]}>
            <Pressable
              style={({ pressed }) => [styles.envelopeChapterBtn, pressed && styles.btnPressed]}
              onPress={() =>
                navigation.navigate('Reading', { chapterId: '1', bookId: 'geen-weg-terug' })
              }
            >
              <Text style={styles.envelopeChapterBtnText}>Lees hoofdstuk 1</Text>
            </Pressable>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

// ─── Section 3: Aidyn ───────────────────────────────────────────────────────

function AidynSection() {
  return (
    <View style={styles.aidynRow}>
      <View style={styles.aidynBar} />
      <View style={styles.aidynContent}>
        <Text style={styles.aidynLabel}>AIDYN ELIAS</Text>
        <Text style={styles.aidynMain}>
          Hij is zeventien. Slim. Rusteloos. Gevaarlijk nieuwsgierig.
        </Text>
        <Text style={styles.aidynSub}>
          Sommige mensen lopen weg van het donker. Aidyn kijkt terug.
        </Text>
      </View>
    </View>
  );
}

// ─── Section 4: Teasers ─────────────────────────────────────────────────────

interface TeasersSectionProps {
  onQuiz: () => void;
  onDossier: () => void;
  onChapters: () => void;
}

function TeasersSection({ onQuiz, onDossier, onChapters }: TeasersSectionProps) {
  const items = [
    {
      key: 'quiz',
      label: 'QUIZ',
      title: 'Wie ben jij als het donker terugkijkt?',
      sub: 'Ontdek welke keuze jij maakt als het stil wordt.',
      icon: 'help-circle-outline' as const,
      onPress: onQuiz,
    },
    {
      key: 'dossier',
      label: 'DOSSIER',
      title: 'Het dossier Elias',
      sub: 'Documenten, sporen, en wat er niet in staat.',
      icon: 'folder-open-outline' as const,
      onPress: onDossier,
    },
    {
      key: 'chapters',
      label: 'HOOFDSTUKKEN',
      title: 'Afdalen begint hier',
      sub: 'Hoofdstuk voor hoofdstuk de nacht in.',
      icon: 'book-outline' as const,
      onPress: onChapters,
    },
  ];

  return (
    <View style={styles.teaserStack}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={({ pressed }) => [styles.teaserCard, pressed && styles.btnPressed]}
          onPress={item.onPress}
        >
          <View style={styles.teaserTopBorder} />
          <View style={styles.teaserHeader}>
            <Ionicons name={item.icon} size={22} color={colors.accent} />
            <Text style={styles.teaserLabel}>{item.label}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textMuted} style={styles.teaserArrow} />
          </View>
          <Text style={styles.teaserTitle}>{item.title}</Text>
          <Text style={styles.teaserSub}>{item.sub}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Section 5: Characters ──────────────────────────────────────────────────

function CharacterCardsSection() {
  return (
    <View>
      <Text style={styles.charHeading}>Wie je tegenkomt</Text>
      <Text style={styles.charSub}>Niemand is hier per ongeluk.</Text>
      <FlatList
        horizontal
        data={CHARACTERS}
        keyExtractor={(item) => item.name}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.charList}
        renderItem={({ item }) => (
          <View style={styles.charCard}>
            <View style={styles.charAvatar}>
              <Text style={styles.charInitial}>{item.name.charAt(0)}</Text>
            </View>
            <Text style={styles.charName}>{item.name}</Text>
            <Text style={styles.charTagline}>{item.tagline}</Text>
          </View>
        )}
      />
    </View>
  );
}

// ─── Section 6: Casa Roja ─────────────────────────────────────────────────

interface CasaRojaSectionProps {
  onFindEntrance: () => void;
}

function CasaRojaSection({ onFindEntrance }: CasaRojaSectionProps) {
  const glow = useLoopPulse(0.2, 0.5, 2800);

  return (
    <View style={styles.casaWrap}>
      <LinearGradient
        colors={['#1a0000', '#6B0F1A', '#1a0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.casaGlow, { opacity: glow }]} />
      <Text style={styles.casaLabel}>C A S A   R O J A</Text>
      <Text style={styles.casaTitle}>Sommige deuren vragen geen toestemming.</Text>
      <Text style={styles.casaBody}>
        Casa Roja is geen plek waar je per ongeluk belandt. Het is een wereld die terugkijkt.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.btnNeon, pressed && styles.btnPressed]}
        onPress={onFindEntrance}
      >
        <Text style={styles.btnNeonText}>Vind de ingang</Text>
      </Pressable>
    </View>
  );
}

// ─── Section 7: Quote ───────────────────────────────────────────────────────

interface QuoteSectionProps {
  scrollY: Animated.Value;
}

function QuoteSection({ scrollY }: QuoteSectionProps) {
  const [layoutY, setLayoutY] = useState(SCREEN_HEIGHT * 2);
  const opacity = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (triggered.current || layoutY === SCREEN_HEIGHT * 2) return;
      if (value > layoutY - SCREEN_HEIGHT * 0.7) {
        triggered.current = true;
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    });
    return () => scrollY.removeListener(id);
  }, [layoutY, opacity, scrollY]);

  return (
    <Animated.View
      style={[styles.quoteBlock, { opacity }]}
      onLayout={(e) => setLayoutY(e.nativeEvent.layout.y)}
    >
      <Text style={styles.quoteMark}>"</Text>
      <Text style={styles.quoteText}>Je wordt niet slecht.{'\n'}Je wordt gevormd.</Text>
    </Animated.View>
  );
}

// ─── Section 8: Unknown number ──────────────────────────────────────────────

interface UnknownNumberSectionProps {
  scrollY: Animated.Value;
}

function UnknownNumberSection({ scrollY }: UnknownNumberSectionProps) {
  const [layoutY, setLayoutY] = useState(SCREEN_HEIGHT * 3);
  const [phase, setPhase] = useState<'idle' | 'typing' | 'message'>('idle');
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const dotPulse = useLoopPulse(0.35, 1, 900);
  const triggered = useRef(false);

  useEffect(() => {
    const animateDots = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      );

    const l1 = animateDots(dot1, 0);
    const l2 = animateDots(dot2, 150);
    const l3 = animateDots(dot3, 300);
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [dot1, dot2, dot3]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (triggered.current || layoutY === SCREEN_HEIGHT * 3) return;
      if (value > layoutY - SCREEN_HEIGHT * 0.65) {
        triggered.current = true;
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setPhase('typing');
          setTimeout(() => {
            setPhase('message');
            Animated.timing(messageOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          }, 1500);
        });
      }
    });
    return () => scrollY.removeListener(id);
  }, [cardOpacity, layoutY, messageOpacity, scrollY]);

  return (
    <Animated.View
      style={[styles.smsCard, { opacity: cardOpacity }]}
      onLayout={(e) => setLayoutY(e.nativeEvent.layout.y)}
    >
      <View style={styles.smsHeader}>
        <Animated.View style={[styles.smsLiveDot, { opacity: dotPulse }]} />
        <Text style={styles.smsLabel}>ONBEKEND NUMMER</Text>
        <Text style={styles.smsTime}>nu</Text>
      </View>
      <View style={styles.smsBody}>
        {phase === 'typing' ? (
          <View style={styles.typingRow}>
            <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
          </View>
        ) : null}
        {phase === 'message' ? (
          <Animated.Text style={[styles.smsMessage, { opacity: messageOpacity }]}>
            Niet iedereen die zwijgt, is veilig.
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Section 9: Descent ─────────────────────────────────────────────────────

interface DescentSectionProps {
  scrollY: Animated.Value;
}

function DescentSection({ scrollY }: DescentSectionProps) {
  const [layoutY, setLayoutY] = useState(SCREEN_HEIGHT * 4);
  const fillWidth = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (triggered.current || layoutY === SCREEN_HEIGHT * 4) return;
      if (value > layoutY - SCREEN_HEIGHT * 0.65) {
        triggered.current = true;
        Animated.timing(fillWidth, {
          toValue: 18,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
    });
    return () => scrollY.removeListener(id);
  }, [fillWidth, layoutY, scrollY]);

  const widthInterpolate = fillWidth.interpolate({
    inputRange: [0, 18],
    outputRange: ['0%', '18%'],
  });

  return (
    <View style={styles.descentCard} onLayout={(e) => setLayoutY(e.nativeEvent.layout.y)}>
      <Text style={styles.descentTitle}>Je bent 18% afgedaald.</Text>
      <Text style={styles.descentLevel}>NIVEAU 1 — DE STRAAT</Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthInterpolate }]} />
      </View>
      <Text style={styles.descentHint}>Rotterdam. Nat. Een envelop. Het begin.</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  lastSection: {
    marginBottom: spacing.lg,
  },

  // Hero
  hero: {
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  heroVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  heroRedGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF1744',
    zIndex: 1,
  },
  heroBreathOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 2,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
    zIndex: 3,
  },
  heroLabel: {
    fontSize: 13,
    letterSpacing: 3,
    color: '#FF1744',
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 62,
    textShadowColor: '#FF1744',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    elevation: 10,
  },
  heroNeonLine: {
    height: 2,
    backgroundColor: '#FF1744',
    marginVertical: 16,
    borderRadius: 1,
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTagline: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: spacing.lg,
  },
  heroBtns: {
    width: '100%',
    alignItems: 'center',
  },
  heroBtnPrimary: {
    backgroundColor: '#FF1744',
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  heroBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  heroBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  heroBtnOutlineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  heroScrollIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 20,
    zIndex: 4,
    opacity: 0.7,
  },

  // Buttons
  btnNeon: {
    backgroundColor: '#FF1744',
    paddingVertical: spacing.md,
    borderRadius: 4,
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 15,
    elevation: 10,
  },
  btnNeonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: spacing.md,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnGhostText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  // Envelope
  envelopeCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#FF1744',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  envelopeIntroLine1: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  envelopeIntroLine2: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing.sm,
  },
  envelopeVisual: {
    width: 200,
    alignItems: 'center',
  },
  envelopeFlapContainer: {
    zIndex: 2,
    marginBottom: -20,
  },
  envelopeFlap: {
    width: 0,
    height: 0,
    borderLeftWidth: 100,
    borderRightWidth: 100,
    borderBottomWidth: 48,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E0E0D8',
  },
  envelopeBody: {
    width: 200,
    height: 130,
    borderRadius: 4,
    backgroundColor: '#F5F5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  envelopeSeal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  envelopeRevealImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  openRevealEnvelopeWrap: {
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  openRevealContainer: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: spacing.md,
    position: 'relative',
  },
  openRevealImage: {
    width: '100%',
    height: '100%',
  },
  openRevealBlack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  openRevealOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  openRevealOverlayText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  openRevealOverlayBtnWrap: {
    width: '100%',
    marginTop: 16,
  },
  openRevealOverlayBtn: {
    backgroundColor: '#FF1744',
    borderRadius: 4,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  envelopeBtns: {
    width: '100%',
    gap: spacing.sm,
  },
  envelopeBtnOpen: {
    backgroundColor: '#FF1744',
    borderRadius: 4,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  envelopeBtnOpenText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  envelopeBtnDiscard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  envelopeBtnDiscardText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  envelopeResponse: {
    marginTop: spacing.lg,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  envelopeChapterWrap: {
    width: '100%',
    marginTop: spacing.lg,
  },
  envelopeChapterBtn: {
    backgroundColor: '#FF1744',
    borderRadius: 4,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  envelopeChapterBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Aidyn
  aidynRow: {
    flexDirection: 'row',
  },
  aidynBar: {
    width: 4,
    backgroundColor: '#FF1744',
    borderRadius: 2,
    marginRight: spacing.lg,
  },
  aidynContent: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  aidynLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FF1744',
    marginBottom: spacing.sm,
  },
  aidynMain: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  aidynSub: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#A3A3A3',
    lineHeight: 24,
  },

  // Teasers
  teaserStack: {
    gap: spacing.md,
  },
  teaserCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  teaserTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF1744',
  },
  teaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  teaserLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FF1744',
  },
  teaserArrow: {
    marginLeft: 'auto',
  },
  teaserTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: spacing.sm,
    paddingRight: spacing.lg,
  },
  teaserSub: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 20,
  },

  // Characters
  charHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  charSub: {
    fontSize: 13,
    color: '#737373',
    marginBottom: spacing.md,
  },
  charList: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  charCard: {
    width: 160,
    height: 200,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#FF1744',
    borderRadius: 8,
    padding: spacing.md,
  },
  charAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#3D1515',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  charInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF1744',
  },
  charName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  charTagline: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#737373',
    lineHeight: 17,
  },

  // Casa Roja
  casaWrap: {
    borderRadius: 8,
    padding: spacing.lg,
    overflow: 'hidden',
    minHeight: 240,
    justifyContent: 'flex-end',
  },
  casaGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF1744',
  },
  casaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#FF1744',
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  casaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  casaBody: {
    fontSize: 15,
    color: '#A3A3A3',
    lineHeight: 22,
    marginBottom: spacing.lg,
    zIndex: 1,
  },

  // Quote
  quoteBlock: {
    backgroundColor: '#000000',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: 8,
  },
  quoteMark: {
    fontSize: 80,
    lineHeight: 80,
    color: '#FF1744',
    marginBottom: -spacing.lg,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
  },

  // SMS
  smsCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A0A0A',
  },
  smsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: spacing.sm,
  },
  smsLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1744',
  },
  smsLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#FF1744',
  },
  smsTime: {
    fontSize: 12,
    color: '#737373',
  },
  smsBody: {
    padding: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#737373',
  },
  smsMessage: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 26,
  },

  // Descent
  descentCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#3D1515',
    borderRadius: 8,
    padding: spacing.lg,
  },
  descentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  descentLevel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FF1744',
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#2A0A0A',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF1744',
    borderRadius: 999,
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  descentHint: {
    fontSize: 13,
    color: '#737373',
  },

  // Audio toggle
  audioToggle: {
    position: 'absolute',
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderWidth: 1,
    borderColor: '#3D1515',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  audioToggleIcon: {
    fontSize: 20,
  },
});
