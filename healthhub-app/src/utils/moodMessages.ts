// src/utils/moodMessages.ts

export const MOOD_MESSAGES: Record<number, string[]> = {
  1: [
    "Mình biết hôm nay có thể rất khó với bạn 😔. Không sao cả, bạn không hề yếu đuối đâu.",
    "Có những ngày chỉ cần tồn tại thôi cũng đã là cố gắng rồi 💙",
    "Cảm xúc này rồi sẽ qua, và bạn không phải đối mặt với nó một mình.",
    "Hãy cho bản thân bạn một chút dịu dàng hôm nay nhé 🌧️",
    "Không cần phải tốt hơn ngay bây giờ, chỉ cần thở chậm lại là đủ."
  ],

  2: [
    "Hôm nay bạn đang ở trạng thái trung bình 😐, và điều đó hoàn toàn ổn.",
    "Không phải ngày nào cũng rực rỡ, nhưng bạn vẫn đang tiến lên.",
    "Chỉ cần một chút thư giãn là bạn sẽ cảm thấy dễ chịu hơn thôi.",
    "Cơ thể và tâm trí bạn có lẽ đang cần nghỉ ngơi nhẹ nhàng.",
    "Chậm lại một chút cũng không sao đâu."
  ],

  3: [
    "Bạn đang khá ổn đó 🙂. Hãy giữ nhịp này một cách nhẹ nhàng nhé.",
    "Một chút vận động hoặc thư giãn sẽ giúp bạn duy trì cảm xúc tích cực.",
    "Hôm nay là một ngày đủ tốt, và như vậy là đáng quý rồi.",
    "Bạn đang cân bằng khá tốt, cứ tiếp tục như vậy nhé 🌱",
    "Cảm xúc ổn định là nền tảng cho những ngày tốt hơn."
  ],

  4: [
    "Thật tuyệt khi bạn đang cảm thấy vui 😊",
    "Năng lượng tích cực này rất đáng trân trọng.",
    "Hãy tận hưởng cảm xúc này theo cách nhẹ nhàng nhất nhé.",
    "Một bài tập thư giãn sẽ giúp bạn giữ cảm giác vui vẻ lâu hơn.",
    "Bạn đang làm rất tốt trong việc chăm sóc bản thân."
  ],

  5: [
    "Bạn đang tràn đầy năng lượng tích cực 😄",
    "Cảm xúc này thật tuyệt, hãy lan tỏa nó cho chính bạn trước nhé.",
    "Hôm nay bạn có vẻ rất mạnh mẽ và tích cực.",
    "Tận dụng năng lượng này cho một hoạt động tốt cho cơ thể nhé!",
    "Đây là một ngày đáng nhớ với tinh thần tuyệt vời của bạn 🌟"
  ],
};

/**
 * Lấy message random, tránh lặp nếu truyền lastMessage
 */
export function getRandomMoodMessage(
  mood: number,
  lastMessage?: string
): string {
  const list = MOOD_MESSAGES[mood] || [];
  if (list.length === 0) return "";

  if (list.length === 1) return list[0];

  let message = list[Math.floor(Math.random() * list.length)];

  // tránh lặp liên tiếp
  if (message === lastMessage) {
    return getRandomMoodMessage(mood, lastMessage);
  }

  return message;
}
