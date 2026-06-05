import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from app.routing.intents import Intent, UrgencyLevel
from app.routing.models import RoutingResult, RoutingContext, RoutingSource

logger = logging.getLogger(__name__)

CONFIDENCE_EXACT = 0.95
CONFIDENCE_PARTIAL = 0.80
CONFIDENCE_WEAK = 0.60

_rule_cache: dict[str, list[tuple[Intent, list[str], list[str]]]] = {}
_cache_loaded = False


@dataclass
class _RuleEntry:
    intent: Intent
    priority: int
    keywords: list[str]
    regex_patterns: list[re.Pattern]
    default_urgency: UrgencyLevel
    urgency_keywords: dict[str, list[str]]


def _build_rules() -> list[_RuleEntry]:
    return [
        _RuleEntry(
            intent=Intent.APPOINTMENT,
            priority=90,
            keywords=[
                "đặt lịch", "đặt lịch khám", "đặt lịch tiêm", "hẹn bác sĩ", "hẹn giờ",
                "book appointment", "đặt lịch vet", "lịch hẹn", "giờ khám",
                "đăng ký khám", "lịch bác sĩ", "tiếp nhận", "schedule", "scheduling",
                "appointment", "book a vet", "đặt lịch trước", "reservation", "đặt chỗ",
            ],
            regex_patterns=[
                re.compile(r"đặt.*lịch", re.IGNORECASE),
                re.compile(r"hẹn.*giờ", re.IGNORECASE),
                re.compile(r"lịch.*khám", re.IGNORECASE),
                re.compile(r"book.*appoint", re.IGNORECASE),
                re.compile(r"schedule.*vet", re.IGNORECASE),
                re.compile(r"tiến.*hành.*đặt", re.IGNORECASE),
                re.compile(r"ngày.*giờ.*khám", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["khẩn cấp", "emergency", "ngay"],
                "critical": [],
            },
        ),
        _RuleEntry(
            intent=Intent.NUTRITION,
            priority=80,
            keywords=[
                "dinh duong", "thuc an", "cho an", "an uong", "an gi", "nen an", "khau phan",
                "dinh dưỡng", "thức ăn", "cho ăn", "ăn uống", "vitamin", "khoáng chất",
                "protein", "fat", "carb", "chất xơ", "calorie", "diet", "food", "feed",
                "eating", "drinking", "nước uống", "ăn", "uống", "bữa ăn", "khẩu phần",
                "pet food", "dog food", "cat food", "nutrition", "nutritional",
                "bao nhiêu", "liều lượng", "tỷ lệ", "cân nặng", "weight management",
                "thực phẩm", "bổ sung", "supplement", "thảo mộc", "organic",
                "meal", "meals", "portion", "amount", "how much should", "how many meals",
            ],
            regex_patterns=[
                re.compile(r"\ban\s+gi\b", re.IGNORECASE),
                re.compile(r"\bnen\s+an\b", re.IGNORECASE),
                re.compile(r"\bcho\s+.*\ban\b", re.IGNORECASE),
                re.compile(r"nên.*ăn", re.IGNORECASE),
                re.compile(r"khẩu.*phần", re.IGNORECASE),
                re.compile(r"thức ăn.*cho", re.IGNORECASE),
                re.compile(r"cho ăn.*bao", re.IGNORECASE),
                re.compile(r"dinh dưỡng.*cho", re.IGNORECASE),
                re.compile(r"food.*dog", re.IGNORECASE),
                re.compile(r"food.*cat", re.IGNORECASE),
                re.compile(r"how much.*feed", re.IGNORECASE),
                re.compile(r"how much.*eat", re.IGNORECASE),
                re.compile(r"how many.*meals", re.IGNORECASE),
                re.compile(r"feed.*kitten", re.IGNORECASE),
                re.compile(r"kitten.*meals", re.IGNORECASE),
                re.compile(r"ăn.*bao.*nhiêu", re.IGNORECASE),
                re.compile(r"protein.*bao", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["không ăn", "bỏ ăn", "nôn", "đi ngoài", "no eating", "vomiting"],
                "critical": [],
            },
        ),
        _RuleEntry(
            intent=Intent.SYMPTOM,
            priority=85,
            keywords=[
                "triệu chứng", "biểu hiện", "bệnh", "đau", "khó chịu", "sốt", "ho",
                "hắt xì", "nôn", "tiêu chảy", "đi ngoài", "mệt", "lờ đờ", "bỏ ăn",
                "uống nhiều", "ngứa", "rụng lông", "rát", "sưng", "phù", "chảy máu",
                "chảy nước", "mắt", "tai", "mũi", "bụng", "chân", "da", "lông",
                "symptom", "symptoms", "sick", "ill", "disease", "pain", "hurt",
                "fever", "cough", "vomit", "diarrhea", "lethargic", "itchy",
                "scratching", "scratch", "bleeding", "swelling", "swollen",
                "bị", "bi", "bệnh gì", "sao", "tại sao", "làm sao", "cách nào",
                "khỏe mạnh", "khỏe", "sức khỏe", "healthy", "health",
                "treatment", "điều trị", "chữa", "thuốc", "medicine", "medication",
                "cách chữa", "what is wrong", "what should I do",
            ],
            regex_patterns=[
                re.compile(r"triệu chứng.*là", re.IGNORECASE),
                re.compile(r"có.*phải.*bệnh", re.IGNORECASE),
                re.compile(r"biểu hiện.*gì", re.IGNORECASE),
                re.compile(r"bệnh.*gì", re.IGNORECASE),
                re.compile(r"sao.*bị", re.IGNORECASE),
                re.compile(r"làm sao.*chữa", re.IGNORECASE),
                re.compile(r"symptom.*is", re.IGNORECASE),
                re.compile(r"what.*wrong", re.IGNORECASE),
                re.compile(r"how to treat", re.IGNORECASE),
                re.compile(r"should.*worried", re.IGNORECASE),
                re.compile(r"is.*normal", re.IGNORECASE),
                re.compile(r"bỏ ăn.*nôn", re.IGNORECASE),
                re.compile(r"nôn.*bỏ ăn", re.IGNORECASE),
                re.compile(r"theo dõi.*dấu hiệu", re.IGNORECASE),
                re.compile(r"not eating.*vomit", re.IGNORECASE),
                re.compile(r"vomit.*not eating", re.IGNORECASE),
                re.compile(r"vomit.*monitor", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.HIGH,
            urgency_keywords={
                "high": [
                    "sốt cao", "ho lâu", "nôn liên tục", "máu", "blood",
                    "sick for days", "sốt trên 40", "ỉa ra máu",
                ],
                "critical": [
                    "khó thở", "can't breathe", "co giật", "seizure",
                    "ngất", "unconscious", "chảy máu nhiều", "severe bleeding",
                    "đau dữ dội", "extreme pain",
                ],
            },
        ),
        _RuleEntry(
            intent=Intent.VACCINE,
            priority=85,
            keywords=[
                "vaccine", "vắc xin", "tiêm phòng", "tiêm chủng", "immunization",
                "immunisation", "mũi tiêm", "lịch tiêm", "tiêm nhắc", "lần tiêm",
                "đã tiêm", "chưa tiêm", "phòng bệnh", "ngừa bệnh", "ngừa",
                "vacxin", "vaccination", "rabies", "dại", "parvovirus", "distemper",
                "5 bệnh", "7 bệnh", "triple", "combo vaccine", "booster", "boost",
                "re-vaccination", "tiêm phòng dại", "tiêm dại", "vaccine for",
            ],
            regex_patterns=[
                re.compile(r"tiêm.*phòng", re.IGNORECASE),
                re.compile(r"tiêm.*chủng", re.IGNORECASE),
                re.compile(r"lịch.*tiêm", re.IGNORECASE),
                re.compile(r"tiêm.*nhắc", re.IGNORECASE),
                re.compile(r"vaccine.*for", re.IGNORECASE),
                re.compile(r"when.*vaccine", re.IGNORECASE),
                re.compile(r"need.*vaccin", re.IGNORECASE),
                re.compile(r"vaccin.*need", re.IGNORECASE),
                re.compile(r"vaccin.*puppy", re.IGNORECASE),
                re.compile(r"puppy.*vaccin", re.IGNORECASE),
                re.compile(r"tiêm.*lần.*nào", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["lần đầu", "chưa tiêm bao giờ", "mới nhận"],
                "critical": [],
            },
        ),
        _RuleEntry(
            intent=Intent.EMERGENCY,
            priority=95,
            keywords=[
                "khẩn cấp", "cấp cứu", "cứu", "emergency", "urgent",
                "can't breathe", "khó thở", "choking", "ngạt",
                "seizure", "co giật", "convulsion",
                "unconscious", "ngất", "fainted", "unresponsive", "không phản ứng",
                "poisoned", "ngộ độc", "toxic", "chất độc", "thuốc độc",
                "severe bleeding", "chảy máu nhiều", "nghiêm trọng",
                "broken bone", "gãy xương", "dislocation", "trật", "disjointed",
                "heatstroke", "say nắng", "overheating", "quá nóng",
                "drowning", "chết đuối", "đuối nước",
                "chết", "chết rồi", "nguy hiểm", "nguy cơ",
            ],
            regex_patterns=[
                re.compile(r"khẩn cấp", re.IGNORECASE),
                re.compile(r"cấp cứu", re.IGNORECASE),
                re.compile(r"emergency", re.IGNORECASE),
                re.compile(r"urgent", re.IGNORECASE),
                re.compile(r"can't.*breath", re.IGNORECASE),
                re.compile(r"seizure.*now", re.IGNORECASE),
                re.compile(r"unconscious", re.IGNORECASE),
                re.compile(r"ngộ.*độc", re.IGNORECASE),
                re.compile(r"chất.*độc.*vào", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.CRITICAL,
            urgency_keywords={
                "high": [],
                "critical": [
                    "khó thở", "can't breathe", "co giật", "seizure",
                    "ngất", "unconscious", "severe bleeding",
                    "ngộ độc", "poisoned", "ngạt", "choking",
                ],
            },
        ),
        _RuleEntry(
            intent=Intent.BILLING,
            priority=80,
            keywords=[
                "giá", "chi phí", "phí", "tiền", "thanh toán", "hóa đơn",
                "billing", "payment", "price", "cost", "fee", "charge", "charges",
                "bao nhiêu tiền", "giá bao nhiêu", "mắc không", "rẻ", "đắt",
                "cheap", "expensive", "bảo hiểm", "insurance", "claim", "bhyt",
                "bảo hiểm thú y", "miễn phí", "free", "có phải trả tiền không",
                "pay", "discount", "khuyến mãi", "ưu đãi", "voucher", "coupon",
                "refund", "hoàn tiền", "hoàn phí", "cancellation fee",
            ],
            regex_patterns=[
                re.compile(r"giá.*bao", re.IGNORECASE),
                re.compile(r"chi phí.*là", re.IGNORECASE),
                re.compile(r"bao nhiêu.*tiền", re.IGNORECASE),
                re.compile(r"price.*is", re.IGNORECASE),
                re.compile(r"cost.*for", re.IGNORECASE),
                re.compile(r"how much.*cost", re.IGNORECASE),
                re.compile(r"thanh toán.*bằng", re.IGNORECASE),
                re.compile(r"pay.*with", re.IGNORECASE),
                re.compile(r"insurance.*cover", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={"high": [], "critical": []},
        ),
        _RuleEntry(
            intent=Intent.GROOMING,
            priority=70,
            keywords=[
                "grooming", "tắm", "tắm rửa", "rửa", "cắt lông", "cắt tóc", "lông",
                "bàn chải", "chải lông", "lược", "xả", "dầu xả", "dầu gội", "sữa tắm",
                "shampoo", "conditioner", "bath", "groom", "grooming",
                "nail", "móng", "cắt móng", "trim nail", "claw",
                "ear cleaning", "làm sạch tai", "vệ sinh tai", "ngoáy tai",
                "tooth", "răng", "đánh răng", "rửa răng", "nước súc miệng",
                "hygiene", "vệ sinh", "sạch sẽ", "thơm", "mùi", "có mùi",
                "skin care", "chăm sóc da", "dưỡng da", "dưỡng lông",
                "bôi", "xịt", "thuốc xịt", "spray", "ointment",
                "flea", "bọ chét", "ve", "tick", "tẩy giun", "deworming",
                "flea collar", "vòng chống ve", "Frontline", "Advocate",
                "tóc", "fur", "coat", "bộ lông", "lông mịn", "lông xù",
            ],
            regex_patterns=[
                re.compile(r"tắm.*cho", re.IGNORECASE),
                re.compile(r"cắt.*lông", re.IGNORECASE),
                re.compile(r"chải.*lông", re.IGNORECASE),
                re.compile(r"vệ sinh.*cho", re.IGNORECASE),
                re.compile(r"groom.*my", re.IGNORECASE),
                re.compile(r"bath.*dog", re.IGNORECASE),
                re.compile(r"bath.*cat", re.IGNORECASE),
                re.compile(r"chăm sóc.*lông", re.IGNORECASE),
                re.compile(r"làm sạch.*tai", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["ve", "bọ chét", "flea", "tick", "nhiễm trùng da"],
                "critical": [],
            },
        ),
        _RuleEntry(
            intent=Intent.TRAINING,
            priority=70,
            keywords=[
                "training", "dạy", "huấn luyện", "đào tạo", "train", "học", "bài tập",
                "dạy đi", "dạy ngồi", "dạy nằm", "lệnh", "command", "commands",
                "sit", "stay", "come", "heel", "down", "fetch", "drop it", "leave it",
                "obedience", "vâng lời", "nghe lời", "nghe hiểu",
                "puppy training", "huấn luyện chó con", "huấn luyện mèo",
                "potty training", "đi vệ sinh đúng chỗ", "dạy đi toilet",
                "crate training", "dạy vào chuồng", "lồng",
                "behavior", "hành vi", "hành vi xấu", "bad behavior",
                "biting", "cắn", "sủa", "barking", "gầm gừ", "growling",
                "aggressive", "hung dữ", "tấn công", "attack",
                "anxious", "lo lắng", "sợ", "fear", "stress", "căng thẳng",
                "separation anxiety", "sợ chia ly", "alone",
                "socialization", "xã hội hóa", "làm quen", "gặp người lạ",
                "tricks", "mẹo", "thủ thuật", "trick training", "clicker", "clicker training",
                "reward", "khen thưởng", "treat",
            ],
            regex_patterns=[
                re.compile(r"huấn luyện.*cho", re.IGNORECASE),
                re.compile(r"dạy.*chó", re.IGNORECASE),
                re.compile(r"dạy.*mèo", re.IGNORECASE),
                re.compile(r"training.*dog", re.IGNORECASE),
                re.compile(r"training.*cat", re.IGNORECASE),
                re.compile(r"how to train", re.IGNORECASE),
                re.compile(r"cách dạy", re.IGNORECASE),
                re.compile(r"bài tập.*cho", re.IGNORECASE),
                re.compile(r"behavior.*problem", re.IGNORECASE),
                re.compile(r"hành vi.*xấu", re.IGNORECASE),
                re.compile(r"sủa.*nhiều", re.IGNORECASE),
                re.compile(r"separation anxiety", re.IGNORECASE),
                re.compile(r"lo lắng.*khi.*để", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["hung dữ", "aggressive", "tấn công", "attack", "cắn người"],
                "critical": [],
            },
        ),
        _RuleEntry(
            intent=Intent.BEHAVIOR,
            priority=75,
            keywords=[
                "behavior", "behaviour", "hành vi", "hành động", "cư xử", "thái độ",
                "emotion", "cảm xúc", "cảm giác", "tâm trạng", "mood",
                "happy", "vui", "buồn", "sad", "sợ", "fear", "anxious", "lo âu",
                "angry", "giận", "bực", "lon", "bored", "chán", "thích", "yêu thích",
                "jealous", "ghen tị", "ghen", "attention seeking", "đòi sự chú ý",
                "hump", "nhảy", "mounting", "giao phối", "sexual behavior",
                "pica", "ăn đồ lạ", "ăn không đúng", "chewing", "nhai đồ",
                "marking", "đánh dấu", "spray", "urine marking",
                "territory", "lãnh thổ", "bảo vệ", "guard",
                "licking", "liếm", "lick paws", "tự liếm", "over-grooming",
                "tails", "đuôi", "body language", "ngôn ngữ cơ thể",
                "dấu hiệu", "signal", "cue", "communication", "giao tiếp",
            ],
            regex_patterns=[
                re.compile(r"hành vi.*là", re.IGNORECASE),
                re.compile(r"tại sao.*lại", re.IGNORECASE),
                re.compile(r"sao.*lại", re.IGNORECASE),
                re.compile(r"why.*is", re.IGNORECASE),
                re.compile(r"cư xử.*như", re.IGNORECASE),
                re.compile(r"behavior.*problem", re.IGNORECASE),
                re.compile(r"strange behavior", re.IGNORECASE),
                re.compile(r"hành vi.*bất thường", re.IGNORECASE),
                re.compile(r"bất thường", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={
                "high": ["tự làm đau mình", "self-harm", "quấy rối", "obsessive"],
                "critical": ["tấn công", "attack", "hung dữ nguy hiểm"],
            },
        ),
        _RuleEntry(
            intent=Intent.PRODUCT,
            priority=60,
            keywords=[
                "product", "sản phẩm", "mua", "mua sắm", "shopping", "shop",
                "bed", "ổ", "chuồng", "nệm", "giường", "mattress",
                "toy", "đồ chơi", "bóng", "gặm", "chew toy", "puzzle toy",
                "food bowl", "chén", "bát ăn", "đĩa", "bowl",
                "water bowl", "bát nước", "fountain", "máy lọc nước",
                "carrier", "lồng", "vận chuyển", "túi", "bag", "crate",
                "collar", "vòng cổ", "dây dẫn", "leash", "harness", "yếm", "đai",
                "ID tag", "thẻ", "name tag", "microchip",
                "gate", "cổng", "barrier", "rào", "fence",
                "cleaning", "làm sạch", "vệ sinh", "súc", "tẩy rửa",
                "poop bag", "túi phân", "litter", "litter box", "khay cát", "cát mèo",
                "supplement", "thực phẩm bổ sung", "vitamin", "probiotic", "men",
                "brand", "nhãn hiệu", "thương hiệu", "recommend",
                "nên mua", "tốt nhất", "best", "top", "đáng mua",
                "review", "đánh giá", "so sánh", "compare",
            ],
            regex_patterns=[
                re.compile(r"mua.*cho", re.IGNORECASE),
                re.compile(r"nên mua", re.IGNORECASE),
                re.compile(r"sản phẩm.*nào", re.IGNORECASE),
                re.compile(r"đồ.*cho", re.IGNORECASE),
                re.compile(r"what.*buy", re.IGNORECASE),
                re.compile(r"best.*for", re.IGNORECASE),
                re.compile(r"recommend.*product", re.IGNORECASE),
                re.compile(r"product.*review", re.IGNORECASE),
                re.compile(r"so sánh.*sản phẩm", re.IGNORECASE),
            ],
            default_urgency=UrgencyLevel.NORMAL,
            urgency_keywords={"high": [], "critical": []},
        ),
    ]


class RuleBasedRouter:
    def __init__(self) -> None:
        self._rules: list[_RuleEntry] = _build_rules()
        self._rules.sort(key=lambda r: r.priority, reverse=True)

    def route(self, context: RoutingContext) -> Optional[RoutingResult]:
        msg_lower = context.message.lower()
        best_match: Optional[RoutingResult] = None
        best_score = 0.0

        for rule in self._rules:
            score, matched_kw = self._score_rule(rule, msg_lower)
            if score <= 0:
                continue

            urgency = self._determine_urgency(rule, msg_lower)

            result = RoutingResult(
                intent=rule.intent,
                confidence=score,
                urgency_level=urgency,
                routing_source=RoutingSource.RULE_BASED,
                reasoning=f"Matched {len(matched_kw)} keyword(s) / pattern(s) for intent '{rule.intent.value}'",
                matched_keywords=matched_kw,
            )

            if score > best_score:
                best_score = score
                best_match = result

        if best_match and best_match.confidence >= CONFIDENCE_WEAK:
            logger.debug(
                "Rule-based matched intent=%s confidence=%.2f",
                best_match.intent.value,
                best_match.confidence,
            )
            return best_match

        return None

    def _score_rule(
        self, rule: _RuleEntry, msg_lower: str
    ) -> tuple[float, list[str]]:
        keyword_matches: list[str] = []
        regex_matches = 0

        for kw in rule.keywords:
            if self._matches_keyword(kw.lower(), msg_lower):
                keyword_matches.append(kw)

        critical_matches = [
            kw for kw in rule.urgency_keywords.get("critical", [])
            if kw.lower() in msg_lower
        ]

        if rule.intent == Intent.EMERGENCY and critical_matches:
            return CONFIDENCE_EXACT, list(dict.fromkeys(keyword_matches + critical_matches))

        for pattern in rule.regex_patterns:
            if pattern.search(msg_lower):
                regex_matches += 1

        total_patterns = len(rule.keywords) + len(rule.regex_patterns)
        if total_patterns == 0:
            return 0.0, []

        match_count = len(keyword_matches) + regex_matches
        ratio = match_count / total_patterns

        if ratio >= 0.15 and len(keyword_matches) >= 2:
            return CONFIDENCE_EXACT, keyword_matches
        elif ratio >= 0.08 and len(keyword_matches) >= 1:
            return CONFIDENCE_PARTIAL, keyword_matches
        elif regex_matches >= 1 and len(keyword_matches) >= 1:
            return CONFIDENCE_PARTIAL, keyword_matches
        elif len(keyword_matches) >= 1:
            return CONFIDENCE_WEAK, keyword_matches

        return 0.0, []

    def _matches_keyword(self, keyword: str, msg_lower: str) -> bool:
        if len(keyword) <= 3 and keyword.isascii():
            return bool(
                re.search(
                    rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])",
                    msg_lower,
                )
            )
        return keyword in msg_lower

    def _determine_urgency(self, rule: _RuleEntry, msg_lower: str) -> UrgencyLevel:
        if rule.intent == Intent.EMERGENCY:
            return UrgencyLevel.CRITICAL

        urgency_map: dict[str, UrgencyLevel] = {
            "critical": UrgencyLevel.CRITICAL,
            "high": UrgencyLevel.HIGH,
        }

        for urgency_str, keywords in rule.urgency_keywords.items():
            for kw in keywords:
                if kw.lower() in msg_lower:
                    return urgency_map.get(urgency_str, rule.default_urgency)

        return rule.default_urgency
