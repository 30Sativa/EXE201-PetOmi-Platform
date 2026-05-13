
ALTER TABLE UserSessions
    ADD ActiveRole     NVARCHAR(20)     NULL,
        ActiveClinicID UNIQUEIDENTIFIER NULL;
ALTER TABLE UserSessions
    ADD CONSTRAINT FK_UserSessions_ActiveClinic
        FOREIGN KEY (ActiveClinicID) REFERENCES Clinics(ClinicID);