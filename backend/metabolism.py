"""User-specified BMR estimate; kg, cm, years; male=0 and female=1."""


def calculate_bmr(weight: float, height: float, age: int, sex: str) -> float:
    if sex not in ('男', '女'):
        raise ValueError('性别必须为男或女')
    sex_code = 0 if sex == '男' else 1
    return 13.88 * weight + 4.16 * height - 3.43 * age - 112.40 * sex_code + 54.34
