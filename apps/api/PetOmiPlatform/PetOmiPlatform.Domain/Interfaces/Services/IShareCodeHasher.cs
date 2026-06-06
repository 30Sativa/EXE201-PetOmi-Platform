namespace PetOmiPlatform.Domain.Interfaces.Services
{
    public interface IShareCodeHasher
    {
        string Hash(string code);
        bool Verify(string code, string hash);
    }
}
