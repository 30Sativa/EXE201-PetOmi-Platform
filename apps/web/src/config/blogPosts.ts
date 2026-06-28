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
  {
    slug: "cho-bi-tieu-chay-cho-an-gi",
    title: "Chó bị tiêu chảy nên cho ăn gì và khi nào cần đi khám?",
    description:
      "Khi chó bị tiêu chảy, chế độ ăn đúng giúp bé hồi phục nhanh hơn. Hướng dẫn nên cho ăn gì, kiêng gì và nhận biết dấu hiệu cần đưa đi khám.",
    date: "2026-06-25",
    author: "Đội ngũ PetOmi",
    readingMinutes: 5,
    tags: ["Chó", "Tiêu hóa"],
    cover: "/hero-pets-new.png",
    content: [
      {
        type: "paragraph",
        text: "Tiêu chảy là một trong những vấn đề tiêu hóa phổ biến nhất ở chó. Phần lớn trường hợp nhẹ có thể cải thiện tại nhà bằng chế độ ăn phù hợp, nhưng cũng có lúc đây là dấu hiệu của bệnh cần điều trị. Bài viết giúp bạn biết nên cho bé ăn gì và khi nào không nên tự xử lý.",
      },
      { type: "heading", text: "Nguyên nhân thường gặp khiến chó tiêu chảy" },
      {
        type: "list",
        items: [
          "Đổi thức ăn đột ngột khiến hệ tiêu hóa chưa kịp thích nghi.",
          "Ăn phải thức ăn ôi thiu, đồ ăn của người hoặc thứ lạ nhặt ngoài đường.",
          "Căng thẳng, thay đổi môi trường.",
          "Nhiễm ký sinh trùng đường ruột (giun, sán).",
          "Nhiễm virus hoặc vi khuẩn, đặc biệt ở chó chưa tiêm phòng đầy đủ.",
        ],
      },
      { type: "heading", text: "Nên cho chó tiêu chảy ăn gì" },
      {
        type: "paragraph",
        text: "Với trường hợp nhẹ, mục tiêu là cho hệ tiêu hóa nghỉ ngơi rồi ăn lại bằng thức ăn nhạt, dễ tiêu:",
      },
      {
        type: "list",
        items: [
          "Có thể nhịn ăn 6–12 giờ (chỉ áp dụng với chó trưởng thành khỏe mạnh) để ruột nghỉ, nhưng luôn để nước sạch.",
          "Sau đó cho ăn thức ăn nhạt: cơm trắng hoặc cháo nấu với thịt gà luộc bỏ da, không gia vị.",
          "Chia thành nhiều bữa nhỏ thay vì một bữa lớn.",
          "Cho ăn lại thức ăn bình thường từ từ trong vài ngày khi phân đã thành khuôn.",
        ],
      },
      { type: "heading", text: "Nên kiêng gì" },
      {
        type: "list",
        items: [
          "Đồ ăn nhiều dầu mỡ, gia vị, đồ ăn của người.",
          "Sữa và các sản phẩm từ sữa (nhiều chó không dung nạp lactose).",
          "Đổi loại thức ăn mới trong lúc bé đang tiêu chảy.",
          "Tự ý dùng thuốc tiêu chảy của người khi chưa hỏi bác sĩ.",
        ],
      },
      {
        type: "callout",
        text: "Chó con, chó nhỏ và chó già mất nước rất nhanh khi tiêu chảy. Với các nhóm này, đừng nhịn ăn và nên đi khám sớm.",
      },
      { type: "heading", text: "Khi nào cần đưa đi khám" },
      {
        type: "list",
        items: [
          "Tiêu chảy kéo dài hơn 24–48 giờ hoặc nặng dần.",
          "Phân có máu, màu đen, hoặc mùi rất tanh bất thường.",
          "Kèm nôn mửa, bỏ ăn, mệt lả.",
          "Có dấu hiệu mất nước: lợi khô, mắt trũng, da mất đàn hồi.",
          "Chó chưa tiêm phòng đầy đủ, đặc biệt là chó con.",
        ],
      },
      { type: "heading", text: "Ghi lại diễn biến để bác sĩ chẩn đoán nhanh hơn" },
      {
        type: "paragraph",
        text: "Số lần đi ngoài, tính chất phân, thời điểm bắt đầu và những gì bé đã ăn gần đây đều là thông tin quan trọng. Ghi lại ngay khi triệu chứng xuất hiện giúp bạn cung cấp cho bác sĩ một bức tranh chính xác, tiết kiệm thời gian chẩn đoán.",
      },
    ],
  },
  {
    slug: "lich-tiem-phong-cho-meo-con",
    title: "Lịch tiêm phòng cho mèo con: những mũi quan trọng cần nhớ",
    description:
      "Mèo con cần được tiêm phòng đúng lịch để tránh các bệnh truyền nhiễm nguy hiểm. Tổng hợp lịch tiêm cơ bản và lưu ý cho người mới nuôi mèo.",
    date: "2026-06-25",
    author: "Đội ngũ PetOmi",
    readingMinutes: 5,
    tags: ["Mèo", "Tiêm phòng"],
    cover: "/hero-pets.png",
    content: [
      {
        type: "paragraph",
        text: "Giống như chó con, mèo con cũng cần được tiêm phòng từ sớm để bảo vệ khỏi những bệnh truyền nhiễm nguy hiểm. Nếu bạn mới đón một bé mèo về nhà, đây là những điều cơ bản cần biết về lịch tiêm phòng.",
      },
      { type: "heading", text: "Vì sao mèo con cần tiêm phòng" },
      {
        type: "paragraph",
        text: "Kháng thể từ mèo mẹ chỉ bảo vệ bé trong vài tuần đầu rồi giảm dần. Sau giai đoạn đó, mèo con rất dễ nhiễm các bệnh như giảm bạch cầu, các bệnh hô hấp do virus. Vaccine giúp cơ thể bé tự tạo miễn dịch trước khi tiếp xúc mầm bệnh.",
      },
      { type: "heading", text: "Lịch tiêm phòng cơ bản tham khảo" },
      {
        type: "list",
        items: [
          "6–8 tuần tuổi: mũi vaccine tổng hợp đầu tiên cho mèo.",
          "10–12 tuần tuổi: mũi nhắc lại.",
          "14–16 tuần tuổi: mũi tổng hợp cuối của đợt cơ bản.",
          "Từ 12 tuần tuổi: vaccine phòng dại (theo khuyến cáo và quy định).",
          "Hằng năm: tiêm nhắc lại để duy trì miễn dịch.",
        ],
      },
      {
        type: "callout",
        text: "Đây là lịch tham khảo chung. Lịch cụ thể tùy tình trạng sức khỏe, môi trường sống (trong nhà hay thả ra ngoài) và loại vaccine. Hãy để bác sĩ thú y tư vấn lịch phù hợp cho bé.",
      },
      { type: "heading", text: "Lưu ý trước và sau khi tiêm" },
      {
        type: "list",
        items: [
          "Chỉ tiêm khi bé khỏe mạnh, ăn uống bình thường.",
          "Nên tẩy giun cho bé trước khi tiêm theo hướng dẫn của bác sĩ.",
          "Theo dõi bé 24–48 giờ sau tiêm để phát hiện phản ứng bất thường.",
          "Đến bác sĩ ngay nếu bé sưng mặt, nôn nhiều, khó thở hoặc lừ đừ kéo dài.",
          "Giữ mèo con trong nhà, tránh tiếp xúc mèo lạ cho đến khi hoàn tất đợt tiêm cơ bản.",
        ],
      },
      { type: "heading", text: "Đừng để lỡ mũi nhắc lại" },
      {
        type: "paragraph",
        text: "Các mũi tiêm cách nhau vài tuần đến cả năm nên rất dễ quên. Việc đặt nhắc nhở cho từng mũi giúp bé luôn được bảo vệ đầy đủ và bạn không phải bắt đầu lại đợt tiêm từ đầu.",
      },
    ],
  },
  {
    slug: "cho-khong-nen-an-gi",
    title: "Những thực phẩm chó tuyệt đối không nên ăn",
    description:
      "Nhiều món ăn quen thuộc của con người lại gây độc cho chó. Danh sách những thực phẩm nguy hiểm cần tránh để giữ bé an toàn.",
    date: "2026-06-26",
    author: "Đội ngũ PetOmi",
    readingMinutes: 4,
    tags: ["Chó", "Dinh dưỡng"],
    cover: "/app-mockup.png",
    content: [
      {
        type: "paragraph",
        text: "Chó thường rất thích xin ăn, và nhiều người nuôi vô tình chia sẻ đồ ăn của mình mà không biết một số món có thể gây ngộ độc nghiêm trọng. Dưới đây là những thực phẩm bạn cần tuyệt đối tránh.",
      },
      { type: "heading", text: "Các thực phẩm nguy hiểm cho chó" },
      {
        type: "list",
        items: [
          "Socola và cacao: chứa chất gây độc cho tim và thần kinh của chó.",
          "Nho và nho khô: có thể gây suy thận, kể cả lượng nhỏ.",
          "Hành, tỏi, hẹ: gây tổn thương hồng cầu, dẫn đến thiếu máu.",
          "Xylitol (chất tạo ngọt trong kẹo cao su, bánh kẹo không đường): cực độc, gây hạ đường huyết.",
          "Rượu, bia và đồ uống có cồn.",
          "Cà phê và đồ uống chứa caffeine.",
          "Xương nấu chín: dễ vỡ vụn gây hóc hoặc thủng ruột.",
          "Đồ ăn quá nhiều muối, dầu mỡ.",
        ],
      },
      {
        type: "callout",
        text: "Nếu nghi ngờ chó đã ăn phải thứ độc, hãy liên hệ bác sĩ thú y ngay và mang theo thông tin về thứ bé đã ăn cùng lượng ước tính. Đừng tự gây nôn khi chưa có hướng dẫn.",
      },
      { type: "heading", text: "Dấu hiệu ngộ độc cần chú ý" },
      {
        type: "list",
        items: [
          "Nôn mửa, tiêu chảy đột ngột.",
          "Run rẩy, co giật, đi loạng choạng.",
          "Thở gấp, tim đập nhanh.",
          "Lừ đừ, bỏ ăn, chảy nhiều nước dãi.",
        ],
      },
      { type: "heading", text: "Phòng tránh hơn chữa" },
      {
        type: "paragraph",
        text: "Cất kỹ thực phẩm nguy hiểm ngoài tầm với, không cho chó ăn đồ ăn của người, và dặn mọi thành viên trong nhà cùng tuân thủ. Một danh sách dán trên tủ lạnh có thể giúp cả nhà nhớ những món cần tránh.",
      },
    ],
  },
  {
    slug: "tay-giun-cho-cho-bao-lau-mot-lan",
    title: "Tẩy giun cho chó bao lâu một lần là đúng?",
    description:
      "Tẩy giun định kỳ giúp chó khỏe mạnh và bảo vệ cả gia đình. Hướng dẫn tần suất tẩy giun theo độ tuổi và dấu hiệu chó bị nhiễm giun.",
    date: "2026-06-26",
    author: "Đội ngũ PetOmi",
    readingMinutes: 4,
    tags: ["Chó", "Phòng bệnh"],
    cover: "/clinic-showcase.png",
    content: [
      {
        type: "paragraph",
        text: "Tẩy giun là một phần quan trọng trong việc chăm sóc sức khỏe chó mà nhiều người hay quên. Giun không chỉ ảnh hưởng đến bé mà một số loại còn có thể lây sang người. Vậy nên tẩy giun bao lâu một lần?",
      },
      { type: "heading", text: "Tần suất tẩy giun tham khảo theo độ tuổi" },
      {
        type: "list",
        items: [
          "Chó con: tẩy giun khá thường xuyên trong những tháng đầu (thường mỗi 2–3 tuần cho đến khoảng 3 tháng tuổi).",
          "Sau đó giãn dần theo hướng dẫn của bác sĩ cho đến khi trưởng thành.",
          "Chó trưởng thành: thường tẩy giun định kỳ mỗi 3–6 tháng tùy môi trường sống và nguy cơ.",
          "Chó hay ra ngoài, tiếp xúc đất, chó khác có thể cần tẩy thường xuyên hơn.",
        ],
      },
      {
        type: "callout",
        text: "Tần suất và loại thuốc tẩy giun nên theo tư vấn của bác sĩ thú y, vì còn phụ thuộc cân nặng, độ tuổi và loại giun phổ biến ở khu vực bạn sống.",
      },
      { type: "heading", text: "Dấu hiệu chó có thể bị nhiễm giun" },
      {
        type: "list",
        items: [
          "Bụng to bất thường, nhất là ở chó con.",
          "Sụt cân dù vẫn ăn, lông xơ xác.",
          "Nôn hoặc tiêu chảy, đôi khi thấy giun trong phân.",
          "Cọ mông xuống sàn.",
          "Mệt mỏi, kém linh hoạt.",
        ],
      },
      { type: "heading", text: "Đừng quên lịch tẩy giun" },
      {
        type: "paragraph",
        text: "Vì tẩy giun lặp lại theo chu kỳ vài tháng, rất dễ quên mất lần gần nhất là khi nào. Ghi lại ngày tẩy giun và đặt nhắc cho lần tiếp theo giúp bạn giữ cho bé luôn được bảo vệ.",
      },
    ],
  },
  {
    slug: "cham-soc-cho-con-moi-ve-nha",
    title: "Chăm sóc chó con mới về nhà: cẩm nang cho người mới nuôi",
    description:
      "Đón chó con về nhà cần chuẩn bị gì? Hướng dẫn từ thức ăn, chỗ ngủ, tiêm phòng đến những việc cần làm trong tuần đầu tiên.",
    date: "2026-06-27",
    author: "Đội ngũ PetOmi",
    readingMinutes: 6,
    tags: ["Chó", "Người mới nuôi"],
    cover: "/hero-pets-new.png",
    content: [
      {
        type: "paragraph",
        text: "Đón một chú chó con về nhà là khoảnh khắc đáng nhớ, nhưng cũng đi kèm nhiều bỡ ngỡ nếu bạn mới nuôi lần đầu. Chuẩn bị tốt ngay từ đầu giúp bé thích nghi nhanh và khỏe mạnh. Đây là những việc quan trọng cần làm.",
      },
      { type: "heading", text: "Chuẩn bị trước khi đón bé về" },
      {
        type: "list",
        items: [
          "Chỗ ngủ ấm áp, yên tĩnh và một góc riêng cho bé.",
          "Bát ăn, bát nước sạch.",
          "Thức ăn phù hợp độ tuổi (ưu tiên giữ nguyên loại bé đang ăn để tránh rối loạn tiêu hóa).",
          "Đồ chơi an toàn, không quá nhỏ để tránh nuốt phải.",
          "Cất kỹ dây điện, hóa chất, cây cảnh độc ngoài tầm với.",
        ],
      },
      { type: "heading", text: "Tuần đầu tiên nên làm gì" },
      {
        type: "list",
        items: [
          "Cho bé thời gian làm quen môi trường mới, tránh quá nhiều người vây quanh.",
          "Giữ lịch ăn đều đặn, chia nhiều bữa nhỏ cho chó con.",
          "Quan sát phân, ăn uống và mức độ năng động để phát hiện sớm bất thường.",
          "Bắt đầu làm quen nhẹ nhàng với việc đi vệ sinh đúng chỗ.",
          "Đặt lịch khám tổng quát đầu tiên với bác sĩ thú y.",
        ],
      },
      {
        type: "callout",
        text: "Tránh đổi thức ăn đột ngột trong những ngày đầu. Nếu cần đổi, hãy trộn dần thức ăn mới vào thức ăn cũ trong 5–7 ngày.",
      },
      { type: "heading", text: "Đừng bỏ lỡ các mốc sức khỏe quan trọng" },
      {
        type: "paragraph",
        text: "Trong vài tháng đầu, chó con cần hoàn thành đợt tiêm phòng cơ bản và tẩy giun định kỳ. Đây là giai đoạn nhiều mốc dễ quên. Lên kế hoạch và đặt nhắc cho từng mốc giúp bé có khởi đầu khỏe mạnh.",
      },
      { type: "heading", text: "Khi nào cần đưa đi khám sớm" },
      {
        type: "list",
        items: [
          "Bỏ ăn, mệt lả hoặc tiêu chảy kéo dài.",
          "Nôn nhiều lần.",
          "Ho, chảy nước mũi, mắt.",
          "Bụng chướng hoặc có dấu hiệu đau.",
        ],
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
