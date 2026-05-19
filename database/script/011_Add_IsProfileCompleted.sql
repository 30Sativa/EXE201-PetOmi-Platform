-- 011_Add_IsProfileCompleted.sql
USE PetOmni_DB;
GO

ALTER TABLE Users
ADD IsProfileCompleted BIT NOT NULL DEFAULT 0;
GO