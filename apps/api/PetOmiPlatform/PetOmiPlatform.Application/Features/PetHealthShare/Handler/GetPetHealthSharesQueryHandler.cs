using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Mappers;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Handler
{
    public class GetPetHealthSharesQueryHandler : IRequestHandler<GetPetHealthSharesQuery, List<PetHealthShareResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthShareTokenRepository _shareTokenRepository;
        private readonly IPetAccessService _accessService;

        public GetPetHealthSharesQueryHandler(
            IPetRepository petRepository,
            IPetHealthShareTokenRepository shareTokenRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _shareTokenRepository = shareTokenRepository;
            _accessService = accessService;
        }

        public async Task<List<PetHealthShareResponse>> Handle(
            GetPetHealthSharesQuery query,
            CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureOwnerAsync(pet, query.UserId, cancellationToken);

            var nowUtc = DateTime.UtcNow;
            var shareTokens = await _shareTokenRepository.GetByPetIdAsync(query.PetId);
            return shareTokens.Select(token => token.ToResponse(nowUtc)).ToList();
        }
    }
}
