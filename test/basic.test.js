// 基本的なテスト
describe('MyRadiko Basic Tests', () => {
    test('should pass basic test', () => {
        expect(1 + 1).toBe(2);
    });
    
    test('should have required environment', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});