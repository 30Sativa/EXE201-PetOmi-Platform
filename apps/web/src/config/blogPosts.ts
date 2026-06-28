import type { BlogPost } from "@/types"

// Dữ liệu các bài viết cẩm nang chăm sóc thú cưng.
// Thêm bài mới: copy một object trong mảng và sửa nội dung. Nhớ slug là duy nhất.
//
// LƯU Ý NỘI DUNG Y TẾ: các bài này mang tính tham khảo, không thay thế chẩn đoán
// của bác sĩ thú y. Nên nhờ người có chuyên môn review trước khi xuất bản rộng rãi.

export const blogPosts: BlogPost[] = [
  {
    slug: "cho-bo-an-khi-nao-can-di-kham",
    title: "Chó bỏ ăn 1–2 ngày: khi nào đáng lo, khi nào cần đưa đi khám?",
    description:
      "Chó bỏ ăn có thể do nhiều nguyên nhân từ nhẹ tới nghiêm trọng. Cùng nhận biết dấu hiệu nguy hiểm và biết khi nào cần đưa bé đến bác sĩ thú y.",
    date: "2026-06-20",
    author: "Đội ngũ PetOmi",
    readingMinutes: 5,
    tags: ["Chó", "Triệu chứng"],
    cover: "/hero-pets-new.png",
    content: [
      {
        type: "paragraph",
        text: "Một trong những lo lắng phổ biến nhất của người nuôi chó là khi bé đột nhiên bỏ ăn. Đôi khi đây chỉ là chuyện nhỏ và sẽ tự hết, nhưng cũng có lúc là dấu hiệu của một vấn đề sức khỏe cần được xử lý sớm. Bài viết này giúp bạn phân biệt hai trường hợp đó.",
      },
      { type: "heading", text: "Những nguyên nhân thường gặp khiến chó bỏ ăn" },
      {
        type: "list",
        items: [
          "Thay đổi môi trường hoặc thói quen (chuyển nhà, có thú cưng mới, chủ vắng nhà).",
          "Thức ăn mới hoặc thức ăn để lâu, ôi thiu, không hợp khẩu vị.",
          "Vấn đề răng miệng gây đau khi nhai.",
          "Rối loạn tiêu hóa nhẹ do ăn phải thứ lạ.",
          "Stress, lo lắng hoặc thay đổi tâm trạng.",
          "Bệnh lý nghiêm trọng hơn: nhiễm trùng, bệnh nội tạng, tắc ruột do nuốt dị vật.",
        ],
      },
      { type: "heading", text: "Dấu hiệu cảnh báo cần đưa đi khám ngay" },
      {
        type: "paragraph",
        text: "Nếu chó chỉ bỏ ăn một bữa nhưng vẫn vui vẻ, uống nước bình thường và đi vệ sinh đều, bạn thường có thể theo dõi thêm tại nhà. Tuy nhiên, hãy đưa bé đến bác sĩ thú y nếu xuất hiện một trong các dấu hiệu sau:",
      },
      {
        type: "list",
        items: [
          "Bỏ ăn kéo dài hơn 24–48 giờ, đặc biệt với chó con và chó nhỏ.",
          "Kèm theo nôn mửa nhiều lần, tiêu chảy hoặc có máu.",
          "Mệt lả, nằm li bì, không phản ứng như thường ngày.",
          "Bụng chướng, đau khi chạm vào.",
          "Bỏ uống nước, có dấu hiệu mất nước (lợi khô, da mất đàn hồi).",
          "Sốt, run rẩy hoặc khó thở.",
        ],
      },
      {
        type: "callout",
        text: "Chó con dưới 6 tháng tuổi mất nước và hạ đường huyết rất nhanh. Nếu chó con bỏ ăn kèm mệt mỏi, đừng chờ đợi — hãy liên hệ bác sĩ thú y sớm.",
      },
      { type: "heading", text: "Bạn có thể làm gì tại nhà trong lúc theo dõi" },
      {
        type: "list",
        items: [
          "Đảm bảo bé luôn có nước sạch để uống.",
          "Thử cho ăn thức ăn dễ tiêu, mềm và ấm để kích thích vị giác.",
          "Giữ môi trường yên tĩnh, giảm căng thẳng cho bé.",
          "Ghi lại thời điểm bắt đầu bỏ ăn và các triệu chứng đi kèm để báo cho bác sĩ.",
        ],
      },
      { type: "heading", text: "Tại sao việc ghi chép lại quan trọng" },
      {
        type: "paragraph",
        text: "Khi đưa bé đi khám, thông tin bạn cung cấp giúp bác sĩ chẩn đoán nhanh và chính xác hơn: bé bỏ ăn từ khi nào, có nôn không, đi vệ sinh ra sao, gần đây ăn gì lạ. Việc nhớ chính xác những chi tiết này trong lúc lo lắng không hề dễ — đó là lý do nên ghi lại ngay khi triệu chứng xuất hiện.",
      },
    ],
  },
  {
    slug: "lich-tiem-phong-cho-cho-con",
    title: "Lịch tiêm phòng cho chó con: hướng dẫn đầy đủ cho người mới nuôi",
    description:
      "Tiêm phòng đúng lịch là cách bảo vệ chó con khỏi các bệnh nguy hiểm. Tổng hợp lịch tiêm cơ bản, các mũi quan trọng và lưu ý sau tiêm.",
    date: "2026-06-22",
    author: "Đội ngũ PetOmi",
    readingMinutes: 6,
    tags: ["Chó", "Tiêm phòng"],
    cover: "/vet-clinic.png",
    content: [
      {
        type: "paragraph",
        text: "Khi mới đón một chú chó con về nhà, một trong những việc quan trọng nhất bạn cần làm là lên kế hoạch tiêm phòng. Vaccine giúp bảo vệ bé khỏi những căn bệnh truyền nhiễm nguy hiểm và đôi khi gây tử vong. Dưới đây là hướng dẫn cơ bản để bạn không bỏ lỡ mũi nào.",
      },
      { type: "heading", text: "Vì sao chó con cần tiêm phòng sớm" },
      {
        type: "paragraph",
        text: "Chó con nhận được kháng thể từ sữa mẹ trong những tuần đầu đời, nhưng lượng kháng thể này giảm dần và không đủ bảo vệ khi bé lớn lên. Đây chính là giai đoạn bé dễ nhiễm bệnh nhất, nên cần được tiêm vaccine để cơ thể tự tạo miễn dịch.",
      },
      { type: "heading", text: "Lịch tiêm phòng cơ bản tham khảo" },
      {
        type: "list",
        items: [
          "6–8 tuần tuổi: mũi vaccine tổng hợp đầu tiên (thường phòng care, parvo và một số bệnh khác).",
          "10–12 tuần tuổi: mũi vaccine tổng hợp nhắc lại.",
          "14–16 tuần tuổi: mũi vaccine tổng hợp cuối của đợt cơ bản.",
          "Từ 12 tuần tuổi trở lên: vaccine phòng dại (theo quy định và khuyến cáo).",
          "Hằng năm: tiêm nhắc lại để duy trì miễn dịch.",
        ],
      },
      {
        type: "callout",
        text: "Đây là lịch tham khảo chung. Lịch cụ thể có thể thay đổi tùy giống chó, tình trạng sức khỏe và loại vaccine. Hãy để bác sĩ thú y tư vấn lịch phù hợp cho bé của bạn.",
      },
      { type: "heading", text: "Những lưu ý trước và sau khi tiêm" },
      {
        type: "list",
        items: [
          "Chỉ tiêm khi bé khỏe mạnh, không sốt, không tiêu chảy.",
          "Sau tiêm nên theo dõi bé trong 24–48 giờ để phát hiện phản ứng bất thường.",
          "Phản ứng nhẹ như mệt, ăn ít, hơi sưng chỗ tiêm thường tự hết.",
          "Đến bác sĩ ngay nếu bé nôn nhiều, sưng mặt, khó thở hoặc lừ đừ kéo dài.",
          "Hạn chế cho chó con tiếp xúc nơi đông chó lạ cho đến khi hoàn tất đợt tiêm cơ bản.",
        ],
      },
      { type: "heading", text: "Đừng quên các mũi nhắc lại" },
      {
        type: "paragraph",
        text: "Một trong những lý do phổ biến khiến vaccine kém hiệu quả là quên lịch nhắc lại. Vì các mũi cách nhau vài tuần đến cả năm, rất dễ nhớ nhầm. Đặt nhắc nhở cho từng mũi giúp bạn giữ cho bé luôn được bảo vệ đầy đủ.",
      },
    ],
  },
  {
    slug: "meo-non-co-sao-khong",
    title: "Mèo nôn: khi nào là bình thường, khi nào là dấu hiệu cần lo lắng?",
    description:
      "Mèo nôn không phải lúc nào cũng nguy hiểm, nhưng có những trường hợp cần đưa đi khám ngay. Cùng tìm hiểu cách phân biệt và xử lý đúng.",
    date: "2026-06-24",
    author: "Đội ngũ PetOmi",
    readingMinutes: 5,
    tags: ["Mèo", "Triệu chứng"],
    cover: "/hero-pets.png",
    content: [
      {
        type: "paragraph",
        text: "Mèo nôn là chuyện không hiếm gặp, và nhiều người nuôi mèo lâu năm đã quen với việc này. Tuy nhiên, không phải lần nôn nào cũng giống nhau. Hiểu được khi nào nôn là bình thường và khi nào là dấu hiệu bệnh sẽ giúp bạn chăm sóc bé tốt hơn.",
      },
      { type: "heading", text: "Những trường hợp nôn thường không đáng lo" },
      {
        type: "list",
        items: [
          "Nôn ra búi lông (hairball) thỉnh thoảng, nhất là ở mèo lông dài.",
          "Nôn ngay sau khi ăn quá nhanh hoặc quá no, rồi vẫn ăn lại bình thường.",
          "Nôn một lần duy nhất nhưng bé vẫn vui vẻ, nhanh nhẹn và ăn uống bình thường.",
        ],
      },
      { type: "heading", text: "Dấu hiệu cho thấy cần đưa mèo đi khám" },
      {
        type: "list",
        items: [
          "Nôn nhiều lần trong ngày hoặc kéo dài liên tục nhiều ngày.",
          "Nôn kèm tiêu chảy, bỏ ăn hoặc sụt cân.",
          "Trong bãi nôn có máu, dịch màu lạ hoặc dị vật.",
          "Bé lừ đừ, trốn một góc, không phản ứng như thường ngày.",
          "Có dấu hiệu mất nước: lợi khô, mắt trũng, da mất đàn hồi.",
          "Nghi ngờ bé đã nuốt phải vật lạ, dây, hoặc cây/hóa chất độc.",
        ],
      },
      {
        type: "callout",
        text: "Nhiều loại cây cảnh trong nhà gây độc cho mèo. Nếu bé nôn sau khi gặm cây, hãy chụp lại loại cây đó và liên hệ bác sĩ thú y ngay.",
      },
      { type: "heading", text: "Bạn nên làm gì khi mèo nôn" },
      {
        type: "list",
        items: [
          "Quan sát kỹ: bé nôn mấy lần, nôn ra gì, có triệu chứng đi kèm không.",
          "Tạm thời cho bé nghỉ ăn vài giờ nhưng vẫn để nước sạch.",
          "Khi cho ăn lại, dùng thức ăn nhạt, dễ tiêu, chia nhỏ bữa.",
          "Dọn dẹp môi trường, loại bỏ thứ bé có thể nuốt nhầm.",
          "Ghi lại diễn biến để báo cho bác sĩ nếu cần đi khám.",
        ],
      },
      { type: "heading", text: "Theo dõi có hệ thống giúp bạn yên tâm hơn" },
      {
        type: "paragraph",
        text: "Khó nhất khi thú cưng có vấn đề là không biết tình trạng đang tốt lên hay xấu đi. Việc ghi lại số lần nôn, thời điểm và triệu chứng theo ngày giúp bạn nhìn rõ xu hướng, và cung cấp cho bác sĩ một bức tranh đầy đủ thay vì phải nhớ lại trong lúc lo lắng.",
      },
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

// Sắp xếp bài mới nhất lên đầu.
export function getSortedPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1))
}
