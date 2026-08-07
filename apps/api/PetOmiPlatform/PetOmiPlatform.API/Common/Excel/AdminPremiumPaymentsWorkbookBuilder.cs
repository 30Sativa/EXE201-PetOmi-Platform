using ClosedXML.Excel;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.API.Common.Excel;

public static class AdminPremiumPaymentsWorkbookBuilder
{
    private const int HeaderRow = 7;
    private const int FirstDataRow = HeaderRow + 1;
    private const int LastColumn = 14;
    private static readonly TimeSpan VietnamUtcOffset = TimeSpan.FromHours(7);

    public static byte[] Build(AdminPremiumPaymentsExportResponse report)
    {
        using var workbook = new XLWorkbook();
        workbook.Properties.Author = "PetOmi";
        workbook.Properties.Title = "Danh sách giao dịch AI Premium đã thanh toán";

        var worksheet = workbook.Worksheets.Add("Giao dịch Premium");
        worksheet.ShowGridLines = false;
        worksheet.SheetView.FreezeRows(HeaderRow);

        BuildTitle(worksheet, report);
        BuildSummary(worksheet, report.Items);
        BuildTable(worksheet, report.Items);
        ApplyColumnLayout(worksheet);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildTitle(
        IXLWorksheet worksheet,
        AdminPremiumPaymentsExportResponse report)
    {
        var titleRange = worksheet.Range(1, 1, 1, LastColumn);
        titleRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#E8F5F0");
        titleRange.Style.Font.Bold = true;
        titleRange.Style.Font.FontColor = XLColor.FromHtml("#14372F");
        titleRange.Style.Font.FontSize = 18;
        titleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        titleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        titleRange.Merge();
        worksheet.Cell(1, 1).Value = "DANH SÁCH GIAO DỊCH AI PREMIUM ĐÃ THANH TOÁN";
        worksheet.Row(1).Height = 34;

        var subtitleRange = worksheet.Range(2, 1, 2, LastColumn);
        subtitleRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#E8F5F0");
        subtitleRange.Style.Font.FontColor = XLColor.FromHtml("#365C52");
        subtitleRange.Style.Font.FontSize = 10;
        subtitleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        subtitleRange.Merge();
        worksheet.Cell(2, 1).Value = $"Khoảng dữ liệu: {BuildDateRangeLabel(report)}  •  Xuất lúc: {FormatVietnamTime(report.GeneratedAtUtc):dd/MM/yyyy HH:mm}";
        worksheet.Row(2).Height = 24;
    }

    private static void BuildSummary(
        IXLWorksheet worksheet,
        IReadOnlyCollection<AdminPremiumPaymentExportItemResponse> items)
    {
        var cards = new[]
        {
            new SummaryCard(1, 3, "GIAO DỊCH PAID", items.Count, "#,##0"),
            new SummaryCard(5, 7, "TÀI KHOẢN ĐÃ MUA", items.Select(item => item.OwnerUserId).Distinct().Count(), "#,##0"),
            new SummaryCard(9, 11, "TỔNG THỰC THU", items.Sum(item => item.Amount), "#,##0 \"VND\""),
            new SummaryCard(13, 14, "TỔNG GIẢM GIÁ", items.Sum(item => item.DiscountAmount), "#,##0 \"VND\"")
        };

        foreach (var card in cards)
        {
            var labelRange = worksheet.Range(4, card.FirstColumn, 4, card.LastColumn);
            labelRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#F3F7F5");
            labelRange.Style.Font.Bold = true;
            labelRange.Style.Font.FontColor = XLColor.FromHtml("#5B726C");
            labelRange.Style.Font.FontSize = 9;
            labelRange.Merge();
            worksheet.Cell(4, card.FirstColumn).Value = card.Label;

            var valueRange = worksheet.Range(5, card.FirstColumn, 5, card.LastColumn);
            valueRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#F3F7F5");
            valueRange.Style.Font.Bold = true;
            valueRange.Style.Font.FontColor = XLColor.FromHtml("#14372F");
            valueRange.Style.Font.FontSize = 15;
            valueRange.Style.NumberFormat.Format = card.NumberFormat;
            valueRange.Merge();
            worksheet.Cell(5, card.FirstColumn).Value = card.Value;

            var cardRange = worksheet.Range(4, card.FirstColumn, 5, card.LastColumn);
            cardRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cardRange.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D8E6E0");
            cardRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }

        worksheet.Row(4).Height = 20;
        worksheet.Row(5).Height = 28;
    }

    private static void BuildTable(
        IXLWorksheet worksheet,
        IReadOnlyList<AdminPremiumPaymentExportItemResponse> items)
    {
        var headers = new[]
        {
            "STT",
            "ID tài khoản",
            "Họ và tên",
            "Email",
            "Gói",
            "Giá gốc",
            "Giảm giá",
            "Thực thu",
            "Voucher",
            "Nhà cung cấp",
            "Mã giao dịch",
            "Mã GD nhà cung cấp",
            "Ngày thanh toán",
            "Hết hạn gói hiện tại"
        };

        for (var column = 1; column <= headers.Length; column++)
            worksheet.Cell(HeaderRow, column).Value = headers[column - 1];

        var headerRange = worksheet.Range(HeaderRow, 1, HeaderRow, LastColumn);
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#14372F");
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRange.Style.Alignment.WrapText = true;
        worksheet.Row(HeaderRow).Height = 30;

        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            var row = FirstDataRow + index;

            worksheet.Cell(row, 1).Value = index + 1;
            worksheet.Cell(row, 2).SetValue(item.OwnerUserId.ToString());
            worksheet.Cell(row, 3).Value = string.IsNullOrWhiteSpace(item.OwnerName)
                ? "Chưa cập nhật"
                : item.OwnerName;
            worksheet.Cell(row, 4).Value = item.OwnerEmail;
            worksheet.Cell(row, 5).Value = item.PlanName;
            worksheet.Cell(row, 6).Value = item.OriginalAmount;
            worksheet.Cell(row, 7).Value = item.DiscountAmount;
            worksheet.Cell(row, 8).Value = item.Amount;
            worksheet.Cell(row, 9).Value = item.VoucherCode ?? "--";
            worksheet.Cell(row, 10).Value = item.Provider;
            worksheet.Cell(row, 11).SetValue(item.PaymentReference);
            worksheet.Cell(row, 12).SetValue(item.ProviderTransactionId ?? "--");
            worksheet.Cell(row, 13).Value = FormatVietnamTime(item.PaidAt);

            if (item.CurrentSubscriptionExpiresAt.HasValue)
                worksheet.Cell(row, 14).Value = FormatVietnamTime(item.CurrentSubscriptionExpiresAt.Value);
            else
                worksheet.Cell(row, 14).Value = "--";
        }

        if (items.Count == 0)
        {
            var emptyRange = worksheet.Range(FirstDataRow, 1, FirstDataRow, LastColumn).Merge();
            emptyRange.Value = "Không có giao dịch Premium đã thanh toán trong khoảng ngày đã chọn.";
            emptyRange.Style.Font.Italic = true;
            emptyRange.Style.Font.FontColor = XLColor.FromHtml("#6B7D78");
            emptyRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            emptyRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            emptyRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAF9");
            worksheet.Row(FirstDataRow).Height = 32;
            return;
        }

        var lastDataRow = FirstDataRow + items.Count - 1;
        var tableRange = worksheet.Range(HeaderRow, 1, lastDataRow, LastColumn);
        var table = tableRange.CreateTable("PremiumPaymentsTable");
        table.Theme = XLTableTheme.TableStyleMedium2;
        table.ShowAutoFilter = true;
        table.ShowRowStripes = true;

        worksheet.Range(FirstDataRow, 1, lastDataRow, LastColumn)
            .Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        worksheet.Range(FirstDataRow, 1, lastDataRow, 1)
            .Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        worksheet.Range(FirstDataRow, 6, lastDataRow, 8)
            .Style.NumberFormat.Format = "#,##0 \"VND\"";
        worksheet.Range(FirstDataRow, 6, lastDataRow, 8)
            .Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        worksheet.Range(FirstDataRow, 13, lastDataRow, 14)
            .Style.NumberFormat.Format = "dd/mm/yyyy hh:mm";
        worksheet.Range(FirstDataRow, 13, lastDataRow, 14)
            .Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
    }

    private static void ApplyColumnLayout(IXLWorksheet worksheet)
    {
        var widths = new Dictionary<int, double>
        {
            [1] = 7,
            [2] = 38,
            [3] = 24,
            [4] = 32,
            [5] = 18,
            [6] = 16,
            [7] = 16,
            [8] = 16,
            [9] = 16,
            [10] = 15,
            [11] = 24,
            [12] = 25,
            [13] = 22,
            [14] = 22
        };

        foreach (var (column, width) in widths)
            worksheet.Column(column).Width = width;

        worksheet.Column(2).Style.NumberFormat.Format = "@";
        worksheet.Column(11).Style.NumberFormat.Format = "@";
        worksheet.Column(12).Style.NumberFormat.Format = "@";
        worksheet.RangeUsed()?.Style.Font.SetFontName("Aptos");
        worksheet.PageSetup.PageOrientation = XLPageOrientation.Landscape;
        worksheet.PageSetup.FitToPages(1, 0);
        worksheet.PageSetup.Margins.SetLeft(0.25);
        worksheet.PageSetup.Margins.SetRight(0.25);
        worksheet.PageSetup.Margins.SetTop(0.5);
        worksheet.PageSetup.Margins.SetBottom(0.5);
    }

    private static string BuildDateRangeLabel(AdminPremiumPaymentsExportResponse report)
    {
        if (!report.FromDate.HasValue && !report.ToDate.HasValue)
            return "Toàn bộ lịch sử";

        var fromLabel = report.FromDate?.ToString("dd/MM/yyyy") ?? "từ đầu";
        var toLabel = report.ToDate?.ToString("dd/MM/yyyy") ?? "đến hiện tại";
        return $"{fromLabel} - {toLabel}";
    }

    private static DateTime FormatVietnamTime(DateTime utcDateTime)
    {
        var normalizedUtc = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        return new DateTimeOffset(normalizedUtc).ToOffset(VietnamUtcOffset).DateTime;
    }

    private sealed record SummaryCard(
        int FirstColumn,
        int LastColumn,
        string Label,
        decimal Value,
        string NumberFormat);
}
