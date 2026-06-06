-- ===================================================================
-- PETOMI - MIGRATION 035
-- Add a friendly public pet code for owner/clinic lookup.
-- This code is an identifier only. It must not grant private health access.
-- ===================================================================

USE PetOmni_DB;
GO

IF COL_LENGTH('Pets', 'PublicPetCode') IS NULL
BEGIN
    ALTER TABLE Pets
    ADD PublicPetCode NVARCHAR(20) NULL;
END
GO

DECLARE @Alphabet NVARCHAR(32) = N'23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
DECLARE @PetID UNIQUEIDENTIFIER;
DECLARE @Code NVARCHAR(20);

DECLARE pet_code_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT PetID
    FROM Pets
    WHERE PublicPetCode IS NULL;

OPEN pet_code_cursor;
FETCH NEXT FROM pet_code_cursor INTO @PetID;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Code = NULL;

    WHILE @Code IS NULL OR EXISTS (SELECT 1 FROM Pets WHERE PublicPetCode = @Code)
    BEGIN
        SET @Code = N'PO-'
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1)
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1)
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1)
            + N'-'
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1)
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1)
            + SUBSTRING(@Alphabet, ABS(CHECKSUM(NEWID())) % LEN(@Alphabet) + 1, 1);
    END

    UPDATE Pets
    SET PublicPetCode = @Code
    WHERE PetID = @PetID;

    FETCH NEXT FROM pet_code_cursor INTO @PetID;
END

CLOSE pet_code_cursor;
DEALLOCATE pet_code_cursor;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Pets_PublicPetCode_Active'
      AND object_id = OBJECT_ID('Pets')
)
BEGIN
    CREATE UNIQUE INDEX UX_Pets_PublicPetCode_Active
    ON Pets(PublicPetCode)
    WHERE PublicPetCode IS NOT NULL AND IsActive = 1;
END
GO
