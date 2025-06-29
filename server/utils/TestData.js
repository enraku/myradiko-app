/**
 * テスト用のモックデータ提供クラス
 */
class TestData {
    static getTestStations() {
        return [
            {
                id: 'TBS',
                name: 'TBSラジオ',
                ascii_name: 'TBS RADIO',
                href: 'https://www.tbsradio.jp/',
                ruby: 'ティービーエスラジオ',
                areafree: '1',
                timefree: '1',
                logo_urls: ['https://radiko.jp/v2/static/station/logo/TBS/240x240.png']
            },
            {
                id: 'QRR',
                name: '文化放送',
                ascii_name: 'NIPPON CULTURAL BROADCASTING',
                href: 'https://www.joqr.co.jp/',
                ruby: 'ぶんかほうそう',
                areafree: '1',
                timefree: '1',
                logo_urls: ['https://radiko.jp/v2/static/station/logo/QRR/240x240.png']
            },
            {
                id: 'LFR',
                name: 'ニッポン放送',
                ascii_name: 'NIPPON BROADCASTING SYSTEM',
                href: 'https://www.1242.com/',
                ruby: 'ニッポンほうそう',
                areafree: '1',
                timefree: '1',
                logo_urls: ['https://radiko.jp/v2/static/station/logo/LFR/240x240.png']
            },
            {
                id: 'RN1',
                name: 'ラジオNIKKEI第1',
                ascii_name: 'RADIO NIKKEI 1',
                href: 'https://www.radionikkei.jp/',
                ruby: 'ラジオニッケイダイイチ',
                areafree: '0',
                timefree: '1',
                logo_urls: ['https://radiko.jp/v2/static/station/logo/RN1/240x240.png']
            },
            {
                id: 'RN2',
                name: 'ラジオNIKKEI第2',
                ascii_name: 'RADIO NIKKEI 2',
                href: 'https://www.radionikkei.jp/',
                ruby: 'ラジオニッケイダイニ',
                areafree: '0',
                timefree: '1',
                logo_urls: ['https://radiko.jp/v2/static/station/logo/RN2/240x240.png']
            }
        ];
    }

    static getTestPrograms(stationId, date) {
        const now = new Date();
        const today = now.toISOString().split('T')[0].replace(/-/g, '');
        
        // 基本的な番組データ
        const basePrograms = [
            {
                id: `${stationId}_001_${date}`,
                title: 'モーニングニュース',
                sub_title: '今日のトピックス',
                desc: '最新のニュースと天気予報をお伝えします。政治、経済、スポーツ、エンターテイメントなど幅広い分野の情報をコンパクトにまとめてお届け。',
                performer: 'アナウンサー田中',
                start_time: '06:00:00',
                end_time: '07:00:00',
                duration: 3600,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_002_${date}`,
                title: 'おはようラジオ',
                sub_title: '朝の情報番組',
                desc: '朝の時間帯にぴったりの軽やかな音楽と、役立つ生活情報をお届けします。リスナーからのメッセージも随時紹介。',
                performer: 'DJ山田、アシスタント佐藤',
                start_time: '07:00:00',
                end_time: '09:00:00',
                duration: 7200,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_003_${date}`,
                title: 'ミュージックタイム',
                sub_title: 'J-POP特集',
                desc: '最新のJ-POPから懐かしの名曲まで、幅広い音楽をお楽しみください。アーティストの秘話やライブ情報も満載。',
                performer: 'DJ鈴木',
                start_time: '12:00:00',
                end_time: '13:00:00',
                duration: 3600,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_004_${date}`,
                title: 'アフタヌーントーク',
                sub_title: 'ゲストトーク',
                desc: '今話題の人物をゲストに迎えて、深いトークを展開。リスナーからの質問にもお答えします。',
                performer: 'パーソナリティ高橋、ゲスト未定',
                start_time: '14:00:00',
                end_time: '16:00:00',
                duration: 7200,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_005_${date}`,
                title: 'ドライブミュージック',
                sub_title: '夕方のBGM',
                desc: 'ドライブにぴったりの楽曲を中心に、リラックスできる音楽をセレクト。一日の疲れを癒します。',
                performer: 'DJ伊藤',
                start_time: '17:00:00',
                end_time: '19:00:00',
                duration: 7200,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_006_${date}`,
                title: 'イブニングニュース',
                sub_title: '今日のまとめ',
                desc: '一日の重要なニュースを振り返り、明日の予定もお伝えします。株式市場の動向や為替情報も含みます。',
                performer: 'ニュースキャスター渡辺',
                start_time: '19:00:00',
                end_time: '20:00:00',
                duration: 3600,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_007_${date}`,
                title: 'ナイトバラエティ',
                sub_title: 'お笑い特集',
                desc: '人気芸人をゲストに迎えて、笑いあふれるトークショーをお届け。リスナー参加のコーナーも人気です。',
                performer: 'MC中村、ゲスト芸人',
                start_time: '21:00:00',
                end_time: '23:00:00',
                duration: 7200,
                station_id: stationId,
                date: date
            },
            {
                id: `${stationId}_008_${date}`,
                title: 'ミッドナイトジャズ',
                sub_title: '深夜のジャズタイム',
                desc: 'クラシックジャズから現代ジャズまで、夜更けにじっくりと聴きたい極上の楽曲をセレクション。',
                performer: 'DJ松本',
                start_time: '23:00:00',
                end_time: '01:00:00',
                duration: 7200,
                station_id: stationId,
                date: date
            }
        ];

        // 今日の日付の場合は現在時刻に基づいて調整
        if (date === today) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}:00`;
            
            // 現在時刻より後の番組のみを返す（過去の番組は除外）
            return basePrograms.filter(program => program.start_time >= currentTimeString);
        }

        return basePrograms;
    }

    static getTestReservations() {
        return [
            {
                id: 1,
                title: 'テスト番組1',
                station_id: 'TBS',
                station_name: 'TBSラジオ',
                start_time: '12:00:00',
                end_time: '13:00:00',
                repeat_type: 'none',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 2,
                title: 'テスト番組2',
                station_id: 'QRR',
                station_name: '文化放送',
                start_time: '18:00:00',
                end_time: '19:00:00',
                repeat_type: 'daily',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
    }

    static getTestRecordings() {
        return [
            {
                id: 1,
                title: '録音済みテスト番組1',
                station_id: 'TBS',
                station_name: 'TBSラジオ',
                file_path: './recordings/TBS_test1.mp3',
                file_size: 5242880, // 5MB
                duration: 3600, // 1時間
                start_time: '2024-01-01 12:00:00',
                end_time: '2024-01-01 13:00:00',
                status: 'completed',
                created_at: '2024-01-01 12:00:00'
            },
            {
                id: 2,
                title: '録音済みテスト番組2',
                station_id: 'QRR',
                station_name: '文化放送',
                file_path: './recordings/QRR_test2.mp3',
                file_size: 10485760, // 10MB
                duration: 7200, // 2時間
                start_time: '2024-01-01 18:00:00',
                end_time: '2024-01-01 20:00:00',
                status: 'completed',
                created_at: '2024-01-01 18:00:00'
            }
        ];
    }
}

module.exports = TestData;