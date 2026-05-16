using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class DeletePetCommandHandler : IRequestHandler<DeletePetCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePetCommandHandler(
            IPetRepository petRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(DeletePetCommand command, CancellationToken cancellationToken)
        {
            // 1. Tìm pet — không tìm thấy hoặc đã xóa thì báo lỗi
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            // 2. Kiểm tra quyền sở hữu
            pet.EnsureOwner(command.UserId);

            // 3. Domain tự xử lý logic xóa mềm — set IsActive=false, DeletedAt=now
            pet.SoftDelete();

            await _petRepository.UpdateAsync(pet);

            // 4. Lưu DB
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
