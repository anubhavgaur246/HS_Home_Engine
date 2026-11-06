
from enum import Enum


class RoleType(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"
    LEAD = "LEAD"
    MANAGER = "MANAGER"
    HR = "HR"
    TA = "TA"
    CO_LEAD = "CO_LEAD"
