using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Query;
using PetOmiPlatform.API.Common;


using PetOmiPlatform.Application.Common.Models;
using System.Security.Claims;


namespace PetOmiPlatform.API.Controllers
{
    [Route("api/examinations/{examinationId:guid}/prescriptions")]

    [Authorize]

    [ApiController]
    [Authorize] // Vet/Clinic

    public class PrescriptionController : BaseController
    {
        public PrescriptionController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// thêm một đơn thuốc mới vào một cuộc khám bệnh cụ thể. Đơn thuốc này sẽ chứa thông tin về loại thuốc, liều lượng, tần suất sử dụng, và hướng dẫn sử dụng cho bệnh nhân. Việc thêm đơn thuốc này sẽ giúp bác sĩ quản lý và theo dõi quá trình điều trị của bệnh nhân một cách hiệu quả hơn.
        /// </summary>
        /// <param name="examinationId"></param>
        /// <param name="request"></param>
        /// <param name="clinicId"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IActionResult> AddPrescriptionItem(
            [FromRoute] Guid examinationId,
            [FromBody] AddPrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new AddPrescriptionItemCommand(clinicId, CurrentUserId, examinationId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Them thuoc vao don thanh cong."));
        }

        /// <summary>
        /// lấy danh sách các đơn thuốc đã được kê cho một cuộc khám bệnh cụ thể. Điều này giúp bác sĩ và nhân viên y tế có cái nhìn tổng quan về các loại thuốc đã được kê, liều lượng, và hướng dẫn sử dụng cho bệnh nhân. Việc truy xuất thông tin này cũng hỗ trợ trong việc theo dõi quá trình điều trị và đảm bảo rằng bệnh nhân nhận được sự chăm sóc phù hợp.
        ///



        [HttpGet]
        public async Task<IActionResult> GetByExaminationId(
            [FromRoute] Guid examinationId,
            [FromQuery] Guid clinicId)
        {
            var query = new GetPrescriptionsByExaminationQuery(clinicId, CurrentUserId, examinationId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IEnumerable<PrescriptionItemResponse>>.Ok(result));
        }
        /// <summary>
        ///  Cập nhật thông tin của một đơn thuốc đã được kê cho một cuộc khám bệnh cụ thể. Việc cập nhật này có thể bao gồm thay đổi loại thuốc, liều lượng, tần suất sử dụng, hoặc hướng dẫn sử dụng cho bệnh nhân. Điều này giúp bác sĩ điều chỉnh quá trình điều trị dựa trên phản hồi của bệnh nhân hoặc thay đổi tình trạng sức khỏe của họ, đảm bảo rằng bệnh nhân nhận được sự chăm sóc tốt nhất có thể.
        /// </summary>


        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromBody] UpdatePrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new UpdatePrescriptionItemCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Cap nhat thuoc trong don thanh cong."));
        }
        /// <summary>
        /// Xoá một đơn thuốc đã được kê cho một cuộc khám bệnh cụ thể. Việc xoá đơn thuốc này có thể xảy ra khi bác sĩ quyết định rằng loại thuốc đó không còn phù hợp với tình trạng sức khỏe của bệnh nhân, hoặc khi có sự thay đổi trong quá trình điều trị. Việc xoá đơn thuốc giúp đảm bảo rằng bệnh nhân không nhận được những loại thuốc không cần thiết hoặc
        /// </summary>
   
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromQuery] Guid clinicId)
        {
            var command = new DeletePrescriptionItemCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Xoa thuoc khoi don thanh cong."));
        }
    }
}