export const characterMapping = {
  // Leo/need
  "이치카": { id: "01", unit: "leoneed", color: "#33aaee", fullName: "호시노 이치카", jpName: "星乃 一歌", engName: "ichika" },
  "사키": { id: "02", unit: "leoneed", color: "#ffdd43", fullName: "텐마 사키", jpName: "天馬 咲希", engName: "saki" },
  "호나미": { id: "03", unit: "leoneed", color: "#EE6666", fullName: "모치즈키 호나미", jpName: "望月 穂波", engName: "honami" },
  "시호": { id: "04", unit: "leoneed", color: "#BBDD22", fullName: "히노모리 시호", jpName: "日野森 志歩", engName: "shiho" },

  // MORE MORE JUMP!
  "미노리": { id: "05", unit: "mmj", color: "#ffccaa", fullName: "하나사토 미노리", jpName: "花里 みのり", engName: "minori" },
  "하루카": { id: "06", unit: "mmj", color: "#99CCFF", fullName: "키리타니 하루카", jpName: "桐谷 遥", engName: "haruka" },
  "아이리": { id: "07", unit: "mmj", color: "#ffaacc", fullName: "모모이 아이리", jpName: "桃井 愛莉", engName: "airi" },
  "시즈쿠": { id: "08", unit: "mmj", color: "#99eedd", fullName: "히노모리 시즈쿠", jpName: "日野森 雫", engName: "shizuku" },

  // Vivid BAD SQUAD
  "코하네": { id: "09", unit: "vbs", color: "#FF6699", fullName: "아즈사와 코하네", jpName: "小豆沢 こはね", engName: "kohane" },
  "안": { id: "10", unit: "vbs", color: "#00BBDD", fullName: "시라이시 안", jpName: "白石 杏", engName: "an" },
  "아키토": { id: "11", unit: "vbs", color: "#FF7722", fullName: "시노노메 아키토", jpName: "東雲 彰人", engName: "akito" },
  "토우야": { id: "12", unit: "vbs", color: "#0077DD", fullName: "아오야기 토우야", jpName: "青柳 冬弥", engName: "touya" },

  // Wonderlands x Showtime
  "츠카사": { id: "13", unit: "wxs", color: "#FFBB00", fullName: "텐마 츠카사", jpName: "天馬 司", engName: "tsukasa" },
  "에무": { id: "14", unit: "wxs", color: "#FF66BB", fullName: "오오토리 에무", jpName: "鳳 えむ", engName: "emu" },
  "네네": { id: "15", unit: "wxs", color: "#33DD99", fullName: "쿠사나기 네네", jpName: "草薙 寧々", engName: "nene" },
  "루이": { id: "16", unit: "wxs", color: "#BB88EE", fullName: "카미시로 루이", jpName: "神代 類", engName: "rui" },

  // 25-ji, Nightcord de.
  "카나데": { id: "17", unit: "niigo", color: "#BB6688", fullName: "요이사키 카나데", jpName: "宵崎 奏", engName: "kanade" },
  "마후유": { id: "18", unit: "niigo", color: "#8888CC", fullName: "아사히나 마후유", jpName: "朝比奈 まふゆ", engName: "mafuyu" },
  "에나": { id: "19", unit: "niigo", color: "#CCAA88", fullName: "시노노메 에나", jpName: "東雲 絵名", engName: "ena" },
  "미즈키": { id: "20", unit: "niigo", color: "#ddaacc", fullName: "아키야마 미즈키", jpName: "暁山 瑞希", engName: "mizuki" },

  // Virtual Singer
  "미쿠": { id: "21", unit: "vs", color: "#33CCBB", fullName: "하츠네 미쿠", jpName: "初音 ミク", engName: "miku" },
  "린": { id: "22", unit: "vs", color: "#FFCC11", fullName: "카가미네 린", jpName: "鏡音 リン", engName: "rin" },
  "렌": { id: "23", unit: "vs", color: "#FFEE11", fullName: "카가미네 렌", jpName: "鏡音 レン", engName: "len" },
  "루카": { id: "24", unit: "vs", color: "#FFBBCC", fullName: "메구리네 루카", jpName: "巡音 ルカ", engName: "luka" },
  "MEIKO": { id: "25", unit: "vs", color: "#DD4444", fullName: "MEIKO", jpName: "MEIKO", engName: "meiko" },
  "KAITO": { id: "26", unit: "vs", color: "#3366CC", fullName: "KAITO", jpName: "KAITO", engName: "kaito" },
  // Korean aliases for compatibility if code uses Korean
  "메이코": { id: "25", unit: "vs", color: "#DD4444", fullName: "MEIKO", jpName: "MEIKO", engName: "meiko" },
  "카이토": { id: "26", unit: "vs", color: "#3366CC", fullName: "KAITO", jpName: "KAITO", engName: "kaito" },
};

// Reverse lookup: get character name by numeric ID (e.g., 21 → "미쿠")
export const getCharacterNameById = (id) => {
  const idStr = String(id).padStart(2, '0');
  for (const [name, info] of Object.entries(characterMapping)) {
    if (info.id === idStr) return name;
  }
  return `캐릭터${id}`;
};
