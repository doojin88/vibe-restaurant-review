# 홈 화면 구현 계획

## 문서 개요

본 문서는 1-home-screen 페이지의 구체적인 구현 계획을 정의합니다. 유스케이스(UC-001), 상태관리 설계, PRD, Userflow, Database 문서를 기반으로 작성되었으며, 기존 코드베이스와 충돌하지 않도록 설계되었습니다.

---

## 1. 현재 코드베이스 상태 분석

### 1.1 구현된 공통 모듈

✅ **백엔드 인프라**:
- Hono 앱 구조 (`src/backend/hono/app.ts`, `context.ts`)
- 미들웨어 (`error.ts`, `context.ts`, `supabase.ts`)
- HTTP 응답 헬퍼 (`src/backend/http/response.ts`)
- Supabase 클라이언트 (`src/backend/supabase/client.ts`)
- 환경 설정 (`src/backend/config/index.ts`)

✅ **프론트엔드 인프라**:
- API 클라이언트 (`src/lib/remote/api-client.ts`)
- Supabase 클라이언트 (`src/lib/supabase/`)
- 공통 유틸리티 (`src/lib/utils.ts`)

✅ **UI 컴포넌트 (shadcn-ui)**:
- 기본 컴포넌트: button, card, input, textarea, label
- 레이아웃 컴포넌트: sheet, separator
- 폼 컴포넌트: form, checkbox, select
- 피드백 컴포넌트: toast, toaster
- 기타: avatar, accordion, dropdown-menu, file-upload, badge

### 1.2 미구현된 공통 모듈

❌ **데이터베이스**:
- places 테이블
- reviews 테이블
- 시드 데이터

❌ **백엔드 기능 모듈**:
- `src/features/place/backend/` 전체
- `src/features/review/backend/` 전체
- Hono 라우터 등록

❌ **프론트엔드 기능 모듈**:
- `src/features/place/hooks/` 전체
- `src/features/place/lib/dto.ts`
- `src/features/place/components/` 전체

❌ **지도 관련 모듈**:
- 지도 SDK 설정 (Naver Map API)
- 지도 컴포넌트
- 위치 서비스

❌ **상태 관리**:
- HomeScreenContext (Context + useReducer)

❌ **추가 UI 컴포넌트**:
- skeleton (로딩 상태)
- alert, alert-dialog (에러/확인)

---

## 2. 구현 단계별 계획

### Phase 0: 선행 작업 (공통 모듈 구현)

이 단계는 홈 화면 개발 전 **반드시 완료**되어야 합니다.

#### 0.1 데이터베이스 마이그레이션 (P0)

**목표**: places, reviews 테이블 생성 및 시드 데이터 삽입

**작업 내용**:
1. `supabase/migrations/0001_create_places_table.sql` 작성
   - places 테이블 생성 (id, name, address, category, latitude, longitude, created_at)
   - 인덱스: idx_places_location, idx_places_name
   - RLS 비활성화
2. `supabase/migrations/0002_create_reviews_table.sql` 작성
   - reviews 테이블 생성 (id, place_id, author_name, rating, content, password_hash, created_at)
   - 외래키: place_id → places(id) ON DELETE CASCADE
   - 인덱스: idx_reviews_place_id, idx_reviews_created_at
   - RLS 비활성화
3. `supabase/migrations/0003_seed_places.sql` 작성
   - 테스트용 장소 데이터 3개 삽입

**검증 방법**:
- Supabase Dashboard에서 SQL 실행 후 테이블 확인
- `SELECT * FROM places;` 쿼리로 시드 데이터 확인

**예상 소요 시간**: 1시간

#### 0.2 백엔드 API - Place 기능 (P0)

**목표**: 장소 관련 API 엔드포인트 구현

**작업 내용**:
1. `src/features/place/backend/schema.ts` 작성
   ```typescript
   // 장소 기본 스키마
   export const PlaceSchema = z.object({
     id: z.string().uuid(),
     name: z.string(),
     address: z.string(),
     category: z.string(),
     latitude: z.number(),
     longitude: z.number(),
     created_at: z.string(),
   });

   // 장소 상세 스키마 (평점 포함)
   export const PlaceDetailSchema = PlaceSchema.extend({
     averageRating: z.number(),
     reviewCount: z.number(),
   });

   // 주변 장소 조회 요청 스키마
   export const GetNearbyPlacesSchema = z.object({
     lat: z.coerce.number(),
     lng: z.coerce.number(),
     radius: z.coerce.number().optional().default(1000),
   });

   // 장소 검색 요청 스키마
   export const SearchPlacesSchema = z.object({
     q: z.string().min(1),
     page: z.coerce.number().optional().default(1),
     limit: z.coerce.number().optional().default(10),
   });
   ```

2. `src/features/place/backend/error.ts` 작성
   ```typescript
   export const PlaceErrorCode = {
     PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
     INVALID_LOCATION: 'INVALID_LOCATION',
     SEARCH_FAILED: 'SEARCH_FAILED',
     FETCH_FAILED: 'FETCH_FAILED',
   } as const;
   ```

3. `src/features/place/backend/service.ts` 작성
   - `PlaceService.getNearbyPlaces()`: 주변 장소 조회 (리뷰 존재 장소만)
   - `PlaceService.getPlaceById()`: 장소 상세 조회 (평균 평점 포함)
   - `PlaceService.searchPlaces()`: 키워드 검색

4. `src/features/place/backend/route.ts` 작성
   - `GET /api/places/nearby`: 주변 장소 조회
   - `GET /api/places/:id`: 장소 상세 조회
   - `GET /api/places/search`: 장소 검색

5. `src/backend/hono/app.ts` 수정
   - place 라우터 등록

**검증 방법**:
- Postman/Thunder Client로 API 테스트
- `GET /api/places/nearby?lat=37.5665&lng=126.9780` 호출 확인

**예상 소요 시간**: 3시간

#### 0.3 프론트엔드 공통 모듈 (P0)

**목표**: 장소 관련 프론트엔드 훅 및 DTO 구현

**작업 내용**:
1. `src/features/place/lib/dto.ts` 작성
   ```typescript
   export {
     PlaceSchema,
     PlaceDetailSchema,
     type Place,
     type PlaceDetail,
   } from '../backend/schema';
   ```

2. `src/features/place/hooks/usePlacesNearbyQuery.ts` 작성
   ```typescript
   export function usePlacesNearbyQuery(
     location: { lat: number; lng: number } | null,
     radius: number = 1000
   ) {
     return useQuery({
       queryKey: ['places', 'nearby', location?.lat, location?.lng, radius],
       queryFn: async () => {
         if (!location) return [];
         const { data } = await apiClient.get('/places/nearby', {
           params: { lat: location.lat, lng: location.lng, radius }
         });
         return data.data.places;
       },
       enabled: !!location,
     });
   }
   ```

3. `src/features/place/hooks/usePlacesSearchQuery.ts` 작성
   ```typescript
   export function usePlacesSearchQuery(keyword: string) {
     return useQuery({
       queryKey: ['places', 'search', keyword],
       queryFn: async () => {
         const { data } = await apiClient.get('/places/search', {
           params: { q: keyword }
         });
         return data.data.places;
       },
       enabled: keyword.length > 0,
     });
   }
   ```

**예상 소요 시간**: 2시간

#### 0.4 지도 SDK 설정 (P0)

**목표**: Naver Map API 설정 및 기본 컴포넌트 구현

**작업 내용**:
1. 환경 변수 추가
   ```bash
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your-client-id
   ```

2. `public/index.html` 또는 `src/app/layout.tsx`에 스크립트 추가
   ```typescript
   <Script
     src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
     strategy="beforeInteractive"
   />
   ```

3. `src/lib/map/naver-map.ts` 작성
   ```typescript
   export interface NaverMapOptions {
     center: { lat: number; lng: number };
     zoom?: number;
   }

   export function createNaverMap(
     container: HTMLElement,
     options: NaverMapOptions
   ): naver.maps.Map {
     // 지도 생성 로직
   }

   export function createMarker(
     map: naver.maps.Map,
     position: { lat: number; lng: number },
     options?: any
   ): naver.maps.Marker {
     // 마커 생성 로직
   }
   ```

4. `src/lib/location/geolocation.ts` 작성
   ```typescript
   export async function getCurrentPosition(): Promise<{
     lat: number;
     lng: number;
   }> {
     return new Promise((resolve, reject) => {
       if (!navigator.geolocation) {
         reject(new Error('Geolocation not supported'));
         return;
       }
       navigator.geolocation.getCurrentPosition(
         (position) => {
           resolve({
             lat: position.coords.latitude,
             lng: position.coords.longitude,
           });
         },
         reject
       );
     });
   }
   ```

**검증 방법**:
- 간단한 테스트 페이지에서 지도 렌더링 확인

**예상 소요 시간**: 2시간

#### 0.5 추가 UI 컴포넌트 설치 (P0)

**작업 내용**:
```bash
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
```

**예상 소요 시간**: 10분

---

### Phase 1: 홈 화면 상태 관리 구현

#### 1.1 HomeScreenContext 구현

**목표**: Context + useReducer 패턴으로 홈 화면 상태 관리

**작업 내용**:
1. `src/features/home/context/types.ts` 작성
   ```typescript
   export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'error';

   export interface HomeScreenState {
     // 지도 상태
     currentLocation: { lat: number; lng: number } | null;
     mapCenter: { lat: number; lng: number };
     zoomLevel: number;
     mapLoading: boolean;
     locationPermission: LocationPermission;

     // 검색 상태
     searchKeyword: string;
     searchModalOpen: boolean;

     // 장소 데이터 상태
     nearbyPlaces: Place[];
     placesLoading: boolean;
     placesError: string | null;

     // UI 상태
     loading: boolean;
   }

   export type HomeScreenAction =
     | { type: 'SET_MAP_CENTER'; payload: { lat: number; lng: number } }
     | { type: 'SET_ZOOM_LEVEL'; payload: number }
     | { type: 'SET_MAP_LOADING'; payload: boolean }
     | { type: 'SET_LOCATION_PERMISSION'; payload: LocationPermission }
     | { type: 'SET_CURRENT_LOCATION'; payload: { lat: number; lng: number } | null }
     | { type: 'SET_SEARCH_KEYWORD'; payload: string }
     | { type: 'OPEN_SEARCH_MODAL' }
     | { type: 'CLOSE_SEARCH_MODAL' }
     | { type: 'SET_NEARBY_PLACES'; payload: Place[] }
     | { type: 'SET_PLACES_LOADING'; payload: boolean }
     | { type: 'SET_PLACES_ERROR'; payload: string | null }
     | { type: 'RESET_STATE' };
   ```

2. `src/features/home/context/reducer.ts` 작성
   ```typescript
   export const initialState: HomeScreenState = {
     currentLocation: null,
     mapCenter: { lat: 37.5665, lng: 126.9780 }, // 서울시청
     zoomLevel: 13,
     mapLoading: false,
     locationPermission: 'prompt',
     searchKeyword: '',
     searchModalOpen: false,
     nearbyPlaces: [],
     placesLoading: false,
     placesError: null,
     loading: false,
   };

   export function homeScreenReducer(
     state: HomeScreenState,
     action: HomeScreenAction
   ): HomeScreenState {
     // switch-case로 액션 처리
   }
   ```

3. `src/features/home/context/HomeScreenContext.tsx` 작성
   ```typescript
   const HomeScreenContext = createContext<HomeScreenContextType | null>(null);

   export function HomeScreenProvider({ children }: { children: ReactNode }) {
     const [state, dispatch] = useReducer(homeScreenReducer, initialState);

     // 액션 함수들
     const setMapCenter = useCallback((center: { lat: number; lng: number }) => {
       dispatch({ type: 'SET_MAP_CENTER', payload: center });
     }, []);

     // ... 기타 액션 함수들

     return (
       <HomeScreenContext.Provider value={{ state, ... }}>
         {children}
       </HomeScreenContext.Provider>
     );
   }

   export function useHomeScreenContext() {
     const context = useContext(HomeScreenContext);
     if (!context) {
       throw new Error('useHomeScreenContext must be used within HomeScreenProvider');
     }
     return context;
   }
   ```

**검증 방법**:
- Context를 사용하는 테스트 컴포넌트 작성
- 각 액션 dispatch 시 상태 변경 확인

**예상 소요 시간**: 2시간

---

### Phase 2: 지도 컴포넌트 구현

#### 2.1 기본 지도 컴포넌트

**목표**: Naver Map SDK를 래핑한 기본 지도 컴포넌트

**작업 내용**:
1. `src/features/home/components/NaverMapContainer.tsx` 작성
   ```typescript
   'use client';

   export function NaverMapContainer({
     center,
     zoom,
     onMapLoad,
     onCenterChanged,
     onZoomChanged,
     children,
   }: NaverMapContainerProps) {
     const mapRef = useRef<HTMLDivElement>(null);
     const [map, setMap] = useState<naver.maps.Map | null>(null);

     useEffect(() => {
       if (!mapRef.current || map) return;

       const newMap = createNaverMap(mapRef.current, {
         center,
         zoom,
       });

       // 이벤트 리스너 등록
       naver.maps.Event.addListener(newMap, 'center_changed', () => {
         const center = newMap.getCenter();
         onCenterChanged?.({ lat: center.lat(), lng: center.lng() });
       });

       naver.maps.Event.addListener(newMap, 'zoom_changed', () => {
         onZoomChanged?.(newMap.getZoom());
       });

       setMap(newMap);
       onMapLoad?.(newMap);
     }, []);

     // center, zoom 변경 시 지도 업데이트
     useEffect(() => {
       if (!map) return;
       map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
     }, [map, center]);

     useEffect(() => {
       if (!map) return;
       map.setZoom(zoom);
     }, [map, zoom]);

     return (
       <div className="relative h-screen w-full">
         <div ref={mapRef} className="h-full w-full" />
         {map && children}
       </div>
     );
   }
   ```

2. `src/features/home/components/MapMarker.tsx` 작성
   ```typescript
   'use client';

   export function MapMarker({
     map,
     position,
     icon,
     onClick,
   }: MapMarkerProps) {
     const markerRef = useRef<naver.maps.Marker | null>(null);

     useEffect(() => {
       if (!map) return;

       const marker = createMarker(map, position, { icon });

       if (onClick) {
         naver.maps.Event.addListener(marker, 'click', () => {
           onClick();
         });
       }

       markerRef.current = marker;

       return () => {
         marker.setMap(null);
       };
     }, [map, position, icon, onClick]);

     return null;
   }
   ```

3. `src/features/home/components/CurrentLocationMarker.tsx` 작성
   ```typescript
   'use client';

   export function CurrentLocationMarker({
     map,
     location,
   }: CurrentLocationMarkerProps) {
     if (!location) return null;

     return (
       <MapMarker
         map={map}
         position={location}
         icon={{
           content: '<div class="current-location-marker">📍</div>',
           size: new naver.maps.Size(30, 30),
           anchor: new naver.maps.Point(15, 15),
         }}
       />
     );
   }
   ```

**예상 소요 시간**: 3시간

#### 2.2 지도 컨트롤 버튼

**작업 내용**:
1. `src/features/home/components/MapControls.tsx` 작성
   ```typescript
   'use client';

   export function MapControls({
     onZoomIn,
     onZoomOut,
     onCurrentLocation,
   }: MapControlsProps) {
     return (
       <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
         <Button
           size="icon"
           variant="outline"
           onClick={onZoomIn}
           className="bg-white shadow-md"
         >
           <Plus className="h-4 w-4" />
         </Button>
         <Button
           size="icon"
           variant="outline"
           onClick={onZoomOut}
           className="bg-white shadow-md"
         >
           <Minus className="h-4 w-4" />
         </Button>
         <Button
           size="icon"
           variant="outline"
           onClick={onCurrentLocation}
           className="bg-white shadow-md"
         >
           <Locate className="h-4 w-4" />
         </Button>
       </div>
     );
   }
   ```

**예상 소요 시간**: 1시��

---

### Phase 3: 검색 기능 구현

#### 3.1 검색 바 컴포넌트

**작업 내용**:
1. `src/features/home/components/SearchBar.tsx` 작성
   ```typescript
   'use client';

   export function SearchBar() {
     const { state, setSearchKeyword, openSearchModal } = useHomeScreenContext();
     const [inputValue, setInputValue] = useState('');

     const handleSearch = () => {
       if (inputValue.trim().length === 0) return;
       setSearchKeyword(inputValue.trim());
       openSearchModal();
     };

     return (
       <div className="absolute left-1/2 top-4 z-10 w-full max-w-md -translate-x-1/2 px-4">
         <div className="flex gap-2">
           <Input
             type="text"
             placeholder="장소명을 검색하세요"
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
             className="bg-white shadow-lg"
           />
           <Button onClick={handleSearch} className="shadow-lg">
             <Search className="h-4 w-4" />
           </Button>
         </div>
       </div>
     );
   }
   ```

**예상 소요 시간**: 1시간

#### 3.2 검색 결과 모달

**작업 내용**:
1. `src/features/home/components/SearchResultsModal.tsx` 작성
   ```typescript
   'use client';

   export function SearchResultsModal() {
     const { state, closeSearchModal } = useHomeScreenContext();
     const { data: searchResults, isLoading } = usePlacesSearchQuery(
       state.searchKeyword
     );
     const router = useRouter();

     if (!state.searchModalOpen) return null;

     return (
       <Sheet open={state.searchModalOpen} onOpenChange={closeSearchModal}>
         <SheetContent side="bottom" className="h-[80vh]">
           <SheetHeader>
             <SheetTitle>검색 결과</SheetTitle>
             <SheetDescription>
               {state.searchKeyword}에 대한 검색 결과입니다
             </SheetDescription>
           </SheetHeader>

           <div className="mt-4 space-y-4">
             {isLoading && (
               <div className="space-y-2">
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
               </div>
             )}

             {!isLoading && searchResults?.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12">
                 <p className="text-muted-foreground">검색 결과가 없습니다</p>
               </div>
             )}

             {searchResults?.map((place) => (
               <Card
                 key={place.id}
                 className="cursor-pointer hover:bg-accent"
                 onClick={() => router.push(`/place/${place.id}`)}
               >
                 <CardHeader>
                   <CardTitle className="text-lg">{place.name}</CardTitle>
                   <CardDescription>
                     {place.address}
                     <br />
                     {place.category}
                   </CardDescription>
                 </CardHeader>
               </Card>
             ))}
           </div>
         </SheetContent>
       </Sheet>
     );
   }
   ```

**예상 소요 시간**: 2시간

---

### Phase 4: 메인 페이지 통합

#### 4.1 홈 페이지 구현

**작업 내용**:
1. `src/app/page.tsx` 수정
   ```typescript
   'use client';

   export default function HomePage() {
     return (
       <HomeScreenProvider>
         <HomePageContent />
       </HomeScreenProvider>
     );
   }

   function HomePageContent() {
     const { state, setMapCenter, setZoomLevel, setCurrentLocation, setLocationPermission } = useHomeScreenContext();
     const [map, setMap] = useState<naver.maps.Map | null>(null);
     const { data: nearbyPlaces } = usePlacesNearbyQuery(state.currentLocation);
     const router = useRouter();

     // 현재 위치 가져오기
     useEffect(() => {
       getCurrentPosition()
         .then((location) => {
           setCurrentLocation(location);
           setMapCenter(location);
           setLocationPermission('granted');
         })
         .catch((error) => {
           console.error('Failed to get current location:', error);
           setLocationPermission('denied');
           // 기본 위치 유지
         });
     }, []);

     const handleMapCenterChanged = useDebouncedCallback(
       (center: { lat: number; lng: number }) => {
         setMapCenter(center);
       },
       300
     );

     return (
       <div className="relative h-screen w-full">
         {state.mapLoading && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
             <Skeleton className="h-full w-full" />
           </div>
         )}

         <NaverMapContainer
           center={state.mapCenter}
           zoom={state.zoomLevel}
           onMapLoad={setMap}
           onCenterChanged={handleMapCenterChanged}
           onZoomChanged={setZoomLevel}
         >
           {/* 현재 위치 마커 */}
           <CurrentLocationMarker
             map={map}
             location={state.currentLocation}
           />

           {/* 장소 마커들 */}
           {nearbyPlaces?.map((place) => (
             <MapMarker
               key={place.id}
               map={map}
               position={{ lat: place.latitude, lng: place.longitude }}
               icon={{
                 content: '<div class="place-marker">📍</div>',
               }}
               onClick={() => router.push(`/place/${place.id}`)}
             />
           ))}
         </NaverMapContainer>

         {/* 검색 바 */}
         <SearchBar />

         {/* 지도 컨트롤 */}
         <MapControls
           onZoomIn={() => setZoomLevel(state.zoomLevel + 1)}
           onZoomOut={() => setZoomLevel(state.zoomLevel - 1)}
           onCurrentLocation={() => {
             if (state.currentLocation) {
               setMapCenter(state.currentLocation);
             }
           }}
         />

         {/* 검색 결과 모달 */}
         <SearchResultsModal />

         {/* 위치 권한 거부 안내 */}
         {state.locationPermission === 'denied' && (
           <Alert className="absolute bottom-4 left-4 right-4 z-10">
             <AlertTitle>위치 권한이 거부되었습니다</AlertTitle>
             <AlertDescription>
               현재 위치를 사용하려면 브라우저 설정에서 위치 권한을 허용해주세요.
             </AlertDescription>
           </Alert>
         )}
       </div>
     );
   }
   ```

**예상 소요 시간**: 2시간

#### 4.2 스타일링 및 반응형 디자인

**작업 내용**:
1. `src/app/globals.css`에 커스텀 스타일 추가
   ```css
   .current-location-marker {
     width: 30px;
     height: 30px;
     font-size: 24px;
     display: flex;
     align-items: center;
     justify-content: center;
     filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
   }

   .place-marker {
     width: 24px;
     height: 24px;
     font-size: 20px;
     display: flex;
     align-items: center;
     justify-content: center;
     cursor: pointer;
     transition: transform 0.2s;
   }

   .place-marker:hover {
     transform: scale(1.2);
   }
   ```

2. 모바일 반응형 확인 및 조정

**예상 소요 시간**: 1시간

---

## 3. 기존 코드베이스와의 충돌 방지

### 3.1 충돌 가능성 분석

#### 3.1.1 페이지 라우팅
- **현재 `/app/page.tsx`**: 기존 example 페이지로 보임
- **대응**: 완전히 덮어쓰기 (홈 화면으로 교체)
- **충돌 위험**: 낮음 (example 페이지는 제거 예정)

#### 3.1.2 API 라우트
- **현재**: example 관련 라우트만 존재
- **추가**: `/api/places/*` 라우트
- **충돌 위험**: 없음 (새로운 라우트)

#### 3.1.3 Supabase 테이블
- **추가**: places, reviews 테이블
- **충돌 위험**: 없음 (신규 테이블)

#### 3.1.4 환경 변수
- **추가**: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
- **충돌 위험**: 없음 (신규 환경 변수)

### 3.2 DRY 원칙 준수

#### 3.2.1 재사용 가능한 컴포넌트
- `NaverMapContainer`: 다른 페이지에서도 지도 사용 시 재사용
- `MapMarker`: 범용 마커 컴포넌트
- `SearchBar`: 다른 페이지에서 검색 필요 시 재사용

#### 3.2.2 공통 훅
- `usePlacesNearbyQuery`: 장소 상세 페이지에서도 사용 가능
- `usePlacesSearchQuery`: 검색 결과 페이지에서 재사용

#### 3.2.3 공통 유틸리티
- `getCurrentPosition`: 다른 페이지에서도 위치 필요 시 사용
- `createNaverMap`, `createMarker`: 지도 관련 모든 페이지에서 사용

---

## 4. 에러 처리 및 엣지 케이스

### 4.1 위치 권한 처리

| 상황 | 처리 방법 |
|------|----------|
| 권한 허용 | 현재 위치로 지도 중심 설정 |
| 권한 거부 | 기본 위치(서울시청)로 설정, Alert 표시 |
| API 미지원 | 기본 위치로 설정, 에러 로깅 |
| 위치 조회 실패 | 기본 위치로 폴백, 에러 로깅 |

### 4.2 지도 로딩 에러

| 상황 | 처리 방법 |
|------|----------|
| SDK 로딩 실패 | Error Boundary로 포착, 재시도 버튼 제공 |
| 네트워크 오류 | 에러 메시지 표시, 재시도 버튼 |
| 잘못된 API 키 | 콘솔 에러, Alert 표시 |

### 4.3 API 에러

| 상황 | 처리 방법 |
|------|----------|
| 주변 장소 조회 실패 | 빈 배열 반환, 에러 토스트 |
| 검색 실패 | 빈 상태 UI 표시, 재시도 버튼 |
| 네트워크 타임아웃 | React Query 재시도 (최대 3회) |

### 4.4 UI 엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 검색어 공백 | 검색 실행 차단, 사용자 안내 |
| 빠른 연속 지도 드래그 | Debounce 처리 (300ms) |
| 장소 데이터 없음 | 빈 지도 표시, 안내 메시지 |
| 매우 많은 마커 | 클러스터링 적용 (향후 개선) |

---

## 5. 성능 최적화

### 5.1 지도 렌더링 최적화
- **마커 재사용**: 기존 마커 제거 후 새로 생성하지 않고 위치만 업데이트
- **Debounce**: 지도 중심 변경 시 API 호출 debounce (300ms)
- **메모이제이션**: useCallback으로 이벤트 핸들러 메모이제이션

### 5.2 React Query 최적화
- **캐싱**: 주변 장소 데이터 5분간 캐싱
- **Stale Time**: 1분으로 설정
- **Refetch 전략**: 포커스 시 refetch 비활성화

### 5.3 컴포넌트 최적화
- **React.memo**: 순수 컴포넌트에 적용 (MapMarker 등)
- **useMemo**: 계산 비용이 큰 값에 적용
- **Code Splitting**: 검색 모달 lazy loading

---

## 6. 테스트 계획

### 6.1 단위 테스트

| 대상 | 테스트 내용 |
|------|------------|
| homeScreenReducer | 각 액션에 대한 상태 변경 검증 |
| getCurrentPosition | 위치 조회 성공/실패 케이스 |
| usePlacesNearbyQuery | API 호출 및 응답 파싱 검증 |

### 6.2 통합 테스트

| 시나리오 | 검증 내용 |
|---------|----------|
| 홈 화면 진입 | 지도 로딩, 현재 위치 감지, 마커 표시 |
| 검색 실행 | 검색 모달 열림, 결과 표시 |
| 마커 클릭 | 장소 상세 페이지로 이동 |

### 6.3 E2E 테스트

| 시나리오 | 검증 내용 |
|---------|----------|
| 전체 플로우 | 진입 → 위치 허용 → 검색 → 마커 클릭 → 상세 페이지 |
| 위치 거부 플로우 | 진입 → 위치 거부 → 기본 위치 표시 |

---

## 7. 구현 체크리스트

### Phase 0: 선행 작업
- [ ] 데이터베이스 마이그레이션 (places, reviews, seed)
- [ ] Place 백엔드 API (schema, error, service, route)
- [ ] Place 프론트엔드 훅 (dto, usePlacesNearbyQuery, usePlacesSearchQuery)
- [ ] Naver Map SDK 설정 (환경 변수, 스크립트)
- [ ] 지도/위치 유틸리티 (naver-map.ts, geolocation.ts)
- [ ] 추가 UI 컴포넌트 (skeleton, alert, alert-dialog)

### Phase 1: 상태 관리
- [ ] HomeScreenContext 타입 정의
- [ ] homeScreenReducer 구현
- [ ] HomeScreenProvider 구현
- [ ] useHomeScreenContext 훅 구현

### Phase 2: 지도 컴포넌트
- [ ] NaverMapContainer 구현
- [ ] MapMarker 구현
- [ ] CurrentLocationMarker 구현
- [ ] MapControls 구현

### Phase 3: 검색 기능
- [ ] SearchBar 구현
- [ ] SearchResultsModal 구현

### Phase 4: 통합
- [ ] 홈 페이지 (page.tsx) 구현
- [ ] 스타일링 및 반응형
- [ ] 에러 처리 추가
- [ ] 성능 최적화 적용

### 테스트 및 검증
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 수동 테스트 (다양한 디바이스)

---

## 8. 예상 소요 시간

| Phase | 작업 내용 | 소요 시간 |
|-------|----------|----------|
| Phase 0 | 선행 작업 (공통 모듈) | 8시간 |
| Phase 1 | 상태 관리 | 2시간 |
| Phase 2 | 지도 컴포넌트 | 4시간 |
| Phase 3 | 검색 기능 | 3시간 |
| Phase 4 | 통합 및 스타일링 | 3시간 |
| 테스트 | 단위/통합/E2E | 4시간 |
| **총계** | | **24시간 (3일)** |

---

## 9. 위험 요소 및 대응 방안

### 9.1 Naver Map API 사용 제한
- **위험**: API 호출 제한 초과
- **대응**: 캐싱 강화, 불필요한 API 호출 최소화

### 9.2 위치 권한 거부율
- **위험**: 많은 사용자가 위치 권한 거부 가능
- **대응**: 기본 위치에서도 충분히 사용 가능하도록 UX 설계

### 9.3 모바일 성능 이슈
- **위험**: 저사양 기기에서 지도 렌더링 느림
- **대응**: 마커 클러스터링, 로딩 최적화

---

## 10. 후속 개선 사항

홈 화면 구현 완료 후 고려할 개선 사항:

1. **마커 클러스터링**: 많은 장소 마커를 클러스터로 그룹화
2. **무한 스크롤**: 검색 결과에 무한 스크롤 적용
3. **실시간 거리 계산**: 현재 위치에서 각 장소까지 거리 표시
4. **필터링 기능**: 카테고리별 장소 필터링
5. **즐겨찾기**: 자주 가는 장소 저장 (로컬 스토리지)

---

## 11. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-10-23 | 1.0.0 | 초안 작성 | AI Agent |

---

**문서 작성 완료**

이 구현 계획은 유스케이스(UC-001), 상태관리 설계, PRD, Userflow, Database 문서를 기반으로 작성되었으며, 기존 코드베이스와 충돌하지 않도록 설계되었습니다. DRY 원칙을 준수하고, 엄밀한 오류 없는 구현을 목표로 합니다.
