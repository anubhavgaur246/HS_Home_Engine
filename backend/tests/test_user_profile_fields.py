import unittest

from modules.data_upload.models import User
from modules.data_upload.schemas import EmployeeImport


class UserProfileFieldTests(unittest.TestCase):
    def test_employee_import_maps_primary_profile_fields(self):
        employee = EmployeeImport.model_validate({
            "ldap": "merugumalas",
            "firstName": "Merugumala",
            "lastName": "Pavan Sai",
            "email": "merugumalas@google.com",
            "highspringEmail": "merugumalas@highspring.in",
            "role": "USER",
            "level": "Tech I",
            "team": "SCSA",
            "programName": "Search Content Strat Acq UXR",
            "projectName": "SCSA",
            "primaryManagerLdap": "arshkaul",
            "primaryLeadLdap": "twinkleb",
        })

        self.assertEqual(employee.level, "Tech I")
        self.assertEqual(employee.team, "SCSA")
        self.assertEqual(employee.programme_name, "Search Content Strat Acq UXR")
        self.assertEqual(employee.projectname, "SCSA")
        self.assertEqual(employee.manager, "arshkaul")
        self.assertEqual(employee.lead, "twinkleb")

    def test_user_model_has_profile_columns(self):
        columns = {column.name for column in User.__table__.columns}
        expected = {"level", "team", "programme_name", "projectname", "manager", "lead", "from_teamsphere"}
        self.assertTrue(expected.issubset(columns))


if __name__ == "__main__":
    unittest.main()
