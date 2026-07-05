using System;
using System.Security.Cryptography;
using System.Text;

namespace FamilyFinance.Application.Services
{
    // Hash de senha com PBKDF2 (biblioteca nativa do .NET, sem depender de pacotes externos).
    // Cada senha gera um salt novo, e o hash nunca é armazenado em texto puro.
    public static class PasswordHasher
    {
        private const int SaltSizeBytes = 16;
        private const int KeySizeBytes = 32;
        private const int Iterations = 100_000;

        public static (string Hash, string Salt) Hash(string password)
        {
            var saltBytes = RandomNumberGenerator.GetBytes(SaltSizeBytes);
            var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                saltBytes,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySizeBytes);

            return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
        }

        public static bool Verify(string password, string storedHash, string storedSalt)
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var computedHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                saltBytes,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySizeBytes);

            var storedHashBytes = Convert.FromBase64String(storedHash);
            return CryptographicOperations.FixedTimeEquals(computedHash, storedHashBytes);
        }
    }
}
