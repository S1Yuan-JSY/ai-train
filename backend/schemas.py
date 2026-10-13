from typing import Annotated, Literal, Union
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)


class Weight(StrictModel):
    type: Literal['weight']
    value: float = Field(ge=20, le=400)


class BodyFat(StrictModel):
    type: Literal['bodyfat']
    value: float = Field(gt=0, lt=100)


class Start(StrictModel):
    type: Literal['start']
    day: str = Field(min_length=1, max_length=40)


class Set(StrictModel):
    type: Literal['set']
    exercise: str = Field(min_length=1, max_length=80)
    weight: float = Field(ge=0, le=1000)
    reps: int | None = Field(ge=1, le=500)


class Food(StrictModel):
    type: Literal['food']
    name: str = Field(min_length=1, max_length=100)
    grams: float = Field(gt=0, le=10000)


class Finish(StrictModel):
    type: Literal['finish']


class Ask(StrictModel):
    type: Literal['ask']
    message: str = Field(min_length=1, max_length=1000)


Action = Annotated[Union[Weight, BodyFat, Start, Set, Food, Finish, Ask], Field(discriminator='type')]
action_adapter = TypeAdapter(Action)


class Context(StrictModel):
    day: str | None = Field(max_length=40)
    lastExercise: str | None = Field(max_length=80)
    foods: list[str] = Field(max_length=500)


class ParseRequest(StrictModel):
    text: str = Field(min_length=1, max_length=1000)
    context: Context


class Profile(StrictModel):
    height: float = Field(ge=80, le=250)
    weight: float = Field(ge=20, le=400)
    sex: Literal['男', '女']
    age: int = Field(ge=18, le=100)
    goal: Literal['减脂', '增肌']
    mode: Literal['健身房', '自重']
    plan: str = Field(min_length=1, max_length=2000)
    injuries: str | None = Field(max_length=2000)
    allergies: str | None = Field(max_length=2000)
    conditions: str | None = Field(max_length=2000)
    forbidden: str | None = Field(max_length=2000)


class Measurement(StrictModel):
    value: float
    at: str = Field(min_length=1, max_length=100)


class TrainingSet(StrictModel):
    exercise: str = Field(min_length=1, max_length=80)
    weight: float = Field(ge=0, le=1000)
    reps: int | None = Field(ge=1, le=500)


class Training(StrictModel):
    day: str = Field(min_length=1, max_length=40)
    at: str = Field(min_length=1, max_length=100)
    sets: list[TrainingSet]
    date: str | None = Field(default=None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    autoClosed: bool = False


class LabelNutrient(StrictModel):
    name: str = Field(min_length=1, max_length=40)
    amount: float = Field(ge=0, le=1000000, allow_inf_nan=False)
    unit: Literal['g', 'mg', 'μg']


class LabelSource(StrictModel):
    basisAmount: float = Field(gt=0, le=10000, allow_inf_nan=False)
    basisUnit: Literal['g', 'ml']
    density: float | None = Field(gt=0, le=20, allow_inf_nan=False)
    energy: float = Field(ge=0, le=100000, allow_inf_nan=False)
    energyUnit: Literal['kJ', 'kcal']
    protein: float = Field(ge=0, allow_inf_nan=False)
    carbs: float = Field(ge=0, allow_inf_nan=False)
    fat: float = Field(ge=0, allow_inf_nan=False)
    extras: list[LabelNutrient] = Field(max_length=30)
    text: str = Field(max_length=12000)
    confirmedAt: str = Field(min_length=1, max_length=100)

    @model_validator(mode='after')
    def require_density(self):
        if self.basisUnit == 'ml' and self.density is None:
            raise ValueError('毫升标签按克换算必须提供密度')
        return self


class FoodData(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    protein: float = Field(ge=0, le=100)
    carbs: float = Field(ge=0, le=100)
    fat: float = Field(ge=0, le=100)
    kcal: float = Field(ge=0, le=1000)
    source: str = Field(min_length=1, max_length=500)
    label: LabelSource | None = None

    @model_validator(mode='after')
    def check_mass(self):
        if self.protein + self.carbs + self.fat > 100.5:
            raise ValueError('每100g三大营养素总量不能超过100g')
        if self.label:
            label = self.label
            grams = label.basisAmount * (label.density if label.basisUnit == 'ml' else 1)
            expected = {'protein': label.protein, 'carbs': label.carbs, 'fat': label.fat,
                        'kcal': label.energy / (4.184 if label.energyUnit == 'kJ' else 1)}
            for key, value in expected.items():
                if abs(getattr(self, key) - value * 100 / grams) > 1e-6:
                    raise ValueError('标签来源与每100g营养值不一致')
        return self


class Meal(StrictModel):
    food: FoodData
    grams: float = Field(gt=0, le=10000)
    estimate: dict | None = None


class Diet(StrictModel):
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    rows: list[Meal]


class TrainingPlan(StrictModel):
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    day: str = Field(min_length=1, max_length=40)
    time: str = Field(pattern=r'^(?:[01]\d|2[0-3]):[0-5]\d$')
    duration: int = Field(ge=1, le=600)
    notes: str = Field(max_length=2000)

    @field_validator('date')
    @classmethod
    def valid_date(cls, value):
        from datetime import date
        date.fromisoformat(value)
        return value


class DailyArchive(StrictModel):
    meals: list[Meal]
    trainings: list[Training]


class MemoryState(StrictModel):
    version: Literal[1]
    profile: Profile | None
    weights: list[Measurement]
    bodyfats: list[Measurement]
    current: Training | None
    previous: dict[str, Training]
    schedules: list[TrainingPlan] = Field(default_factory=list, max_length=2000)
    foods: list[FoodData]
    diet: Diet
    processed: list[str]
    archives: dict[str, DailyArchive] = Field(default_factory=dict)

    @field_validator('archives')
    @classmethod
    def valid_archive_dates(cls, values):
        from datetime import date
        for key in values:
            if date.fromisoformat(key).isoformat() != key:
                raise ValueError('归档日期无效')
        return values

    @model_validator(mode='after')
    def unique_schedule_dates(self):
        if len({plan.date for plan in self.schedules}) != len(self.schedules):
            raise ValueError('同一天的计划重复')
        return self


class MemoryRequest(StrictModel):
    revision: int = Field(ge=0)
    state: MemoryState


class Credentials(StrictModel):
    username: str = Field(pattern=r'^[a-zA-Z0-9_\-]{3,40}$')
    password: str = Field(min_length=10, max_length=128)


class Registration(Credentials):
    # Accept the retired field from cached clients; registration no longer requires it.
    invite_token: str | None = Field(default=None, max_length=256)


class LegacyImport(StrictModel):
    invite_token: str = Field(min_length=1, max_length=256)


class PreferenceRequest(StrictModel):
    text: str = Field(min_length=1, max_length=2000)


class ChatRequest(StrictModel):
    text: str = Field(min_length=1, max_length=2000)
    thread_id: str | None = Field(default=None, pattern=r'^[a-f0-9]{32}$')
