
### requrement.md 작성

### prd.md 작성
```
agent prd-writer 를 이용하여 prd 작성한다.
```

### service.md

```
지금까지 조사한 내용을 종합하여 최종 문서로 작성해주세요.

다음 내용을 반드시 포함해야합니다.

- API 연동
- 각 수단에 대해 사용할 기능
- 각 수단에 대한 설치/세팅 방법
- 각 수단에 대한 인증정보 관리 방법
- 각 수단에 대한 호출 방법
```

### 작업 절차

```
다음과 같이 작업하라.

1. prd-writer 에이전트를 사용하여 /docs/prd.md 경로에 PRD 문서를 작성하라.
2. userflow-writer 에이전트를 사용하여 /docs/userflow.md 경로에 Userflow 문서를 작성하라.
3. database-architect 에이전트를 사용하여 /docs/database.md 경로에 데이터베이스 설계를 작성하라.
4. database-critic 에이전트를 사용하여 /docs/database.md 경로에 있는 데이터베이스 설계를 개선하라.
5. `/docs/userflow.md` 문서를 읽고, 여기 언급된 기능들에대해 usecase-writer 에이전트를 사용하여 유스케이스 문서를 작성하라.

이들은 모두 병렬로 실행되어야한다.

```
