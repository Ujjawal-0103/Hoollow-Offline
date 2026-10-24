'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'assistant',
    text: `Hello! I am your **Upwise AI Learning Tutor** powered by Gemini. 

I'm here to explain concepts simply, generate code walkthroughs, debug errors, or test your understanding with practice questions. What are you studying today?`,
    timestamp: 'Just now',
  },
];

const SUGGESTED_PROMPTS = [
  'Explain async/await like I am 10',
  'Give me a real-world Promise example',
  'Quiz me on JavaScript closures',
  'Difference between const, let, and var',
];

export function AiTutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(100);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const generateResponse = async (userPrompt: string): Promise<string> => {
    const q = userPrompt.toLowerCase();

    // Contextual intelligent responses for common web dev topics
    if (q.includes('async') || q.includes('promise') || q.includes('await')) {
      return `### Asynchronous JavaScript & Promises

Think of a **Promise** like a restaurant pager:
1. **Order Placed (Pending):** You order food at the counter. They hand you a pager. You don't have food yet, but you have a guarantee it's coming.
2. **Food Ready (Fulfilled):** The pager buzzes! You pick up your meal. In JavaScript, this is the \`.then()\` handler or resolved \`await\`.
3. **Kitchen Out of Food (Rejected):** The chef informs you they ran out. In JavaScript, this is the \`.catch()\` handler.

\`\`\`javascript
async function getMeal() {
  try {
    const meal = await orderFood();
    console.log("Enjoying:", meal);
  } catch (err) {
    console.error("Order failed:", err);
  }
}
\`\`\`

**Rule of Thumb:** Always wrap \`await\` calls inside a \`try...catch\` block! Would you like another practice question on this?`;
    }

    if (q.includes('quiz') || q.includes('test')) {
      return `### Quick Concept Check! 🧠

**Question:** Which of the following statements about \`async\` functions is true?

A) They run in a separate operating system process.
B) They always return a Promise, even if you return a plain number.
C) They cannot contain \`try...catch\` blocks.
D) They block user clicks while executing.

*Reply with your answer (A, B, C, or D) and I'll evaluate your explanation!*`;
    }

    if (q.includes('closure')) {
      return `### JavaScript Closures Explained Simply

A **closure** is when an inner function remembers variables from its outer enclosing scope, even after that outer function has finished executing!

\`\`\`javascript
function createCounter() {
  let count = 0; // private state
  return function increment() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

Here, \`increment\` keeps a persistent reference to \`count\` closed within its environment.`;
    }

    if (q.includes('const') || q.includes('let') || q.includes('var')) {
      return `### \`const\` vs \`let\` vs \`var\`

- **\`const\` (Default Choice):** Block-scoped. Cannot be reassigned. Use this for 90% of variables to prevent accidental reassignment bugs.
- **\`let\`:** Block-scoped. Can be reassigned. Ideal for loop counters and accumulators.
- **\`var\` (Legacy):** Function-scoped and hoisted. Avoid in modern ES6+ code because it can cause scope-leak bugs.`;
    }

    return `### AI Tutor Insight

Great question about **${userPrompt}**!

In modern software development, breaking complex concepts into smaller isolated components is the most reliable path to mastery.

**Key Principles to keep in mind:**
1. **Isolate State:** Keep functions deterministic whenever possible.
2. **Handle Errors Early:** Always plan for edge cases (network offline, null responses).
3. **Practice Incrementally:** Test concepts in the Upwise Practice Arena to reinforce memory retention.

Would you like a code snippet, an analogy, or a quick practice quiz on this topic?`;
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isThinking) return;

    idCounterRef.current += 1;
    const currentId = idCounterRef.current;

    const userMessage: Message = {
      id: `msg-${currentId}`,
      sender: 'user',
      text,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      // Small simulated response delay for natural conversation flow
      await new Promise((resolve) => setTimeout(resolve, 800));
      const aiReply = await generateResponse(text);

      idCounterRef.current += 1;
      const assistantId = idCounterRef.current;

      const assistantMessage: Message = {
        id: `msg-${assistantId}`,
        sender: 'assistant',
        text: aiReply,
        timestamp: 'Now',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#087F8C] text-white shadow-xl hover:bg-[#076d78] hover:scale-105 transition-all cursor-pointer font-medium text-sm"
          aria-label="Open AI Tutor"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Ask AI Tutor</span>
        </button>
      )}

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col border-l border-[#E6E9E8] animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[#E6E9E8] bg-[#FAF9F5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D6F0EF] text-[#087F8C] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#242039] flex items-center gap-1.5">
                  <span>Upwise AI Tutor</span>
                  <Badge variant="teal" size="sm">
                    Gemini 1.5
                  </Badge>
                </h3>
                <span className="text-[11px] text-[#667085]">Concept explanations &amp; code guidance</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#667085] hover:bg-gray-200 transition-colors"
              aria-label="Close AI Tutor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-[#087F8C] text-white'
                        : 'bg-[#D6F0EF] text-[#087F8C]'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-[14px] text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#087F8C] text-white rounded-tr-none'
                        : 'bg-[#FAF9F5] text-[#242039] border border-[#E6E9E8] rounded-tl-none'
                    }`}
                  >
                    {m.text}
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        isUser ? 'text-white/70 text-right' : 'text-[#667085]'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-[#667085] p-2 bg-[#FAF9F5] rounded-[10px] w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#087F8C]" />
                <span>Gemini tutor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-4 py-2 bg-[#FAF9F5]/70 border-t border-[#E6E9E8] overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isThinking}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium rounded-full border border-[#E6E9E8] bg-white text-[#242039] hover:border-[#087F8C] hover:bg-[#D6F0EF]/30 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#E6E9E8] bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about this lesson or concept..."
                className="flex-1 px-3 py-2 text-xs rounded-[10px] border border-[#E6E9E8] focus:outline-none focus:border-[#087F8C] text-[#242039]"
                disabled={isThinking}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!input.trim() || isThinking}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
