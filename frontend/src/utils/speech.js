/**
 * Clean markdown symbols for natural text-to-speech reading.
 */
export const stripMarkdownForSpeech = (markdown) => {
  if (!markdown) return '';
  return markdown
    .replace(/```[\s\S]*?```/g, 'Code block omitted.') // skip long code blocks
    .replace(/`([^`]+)`/g, '$1')                        // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1')                  // bold
    .replace(/\*([^*]+)\*/g, '$1')                      // italic
    .replace(/#{1,6}\s+/g, '')                          // headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')            // links
    .replace(/[•\-\*]\s+/g, '')                         // bullet points
    .replace(/\|[^\n]+\|/g, '')                         // tables
    .replace(/\n+/g, '. ')                              // paragraphs to sentences
    .trim();
};

/**
 * Text-to-Speech (Speak answer aloud).
 */
export const speak = (text, onEnd) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // cancel any active speech

  const cleanText = stripMarkdownForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Pick a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (naturalVoice) utterance.voice = naturalVoice;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Speech Recognition (Voice Input / Dictation).
 */
export const createSpeechRecognition = (onTranscript, onError, onEnd) => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onTranscript(transcript);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};
