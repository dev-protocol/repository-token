import { validateErrorMessage } from '../../test-lib/utils/error'

contract('AdminAndOperatorRole', ([deployer, user1, user2]) => {
	describe('constructor', () => {
		it('The deployer gets admin privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			let hasAdmin = await role.hasAdmin(deployer)
			expect(hasAdmin).to.be.equal(true)
			hasAdmin = await role.hasAdmin(user1)
			expect(hasAdmin).to.be.equal(false)
		})
	})

	describe('addAdmin, removeAdmin, hasAdmin', () => {
		it('Permissions can be added or removed.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			let hasAdmin = await role.hasAdmin(user1)
			expect(hasAdmin).to.be.equal(false)
			await role.addAdmin(user1)
			hasAdmin = await role.hasAdmin(user1)
			expect(hasAdmin).to.be.equal(true)
			await role.removeAdmin(user1)
			hasAdmin = await role.hasAdmin(user1)
			expect(hasAdmin).to.be.equal(false)
		})
		it('Only administrators can add permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			const result = await role
				.addAdmin(user1, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have admin role')
		})
		it('Only administrators can remove permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			const result = await role
				.removeAdmin(user1, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have admin role')
		})
		it('Anyone can check to see if who has permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			const hasAdmin = await role.hasAdmin(deployer, { from: user1 })
			expect(hasAdmin).to.be.equal(true)
		})
		it('we can not remove all administrators.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			const result = await role.removeAdmin(deployer).catch((err: Error) => err)
			validateErrorMessage(result, 'last administrator can not be removed')
			const hasAdmin = await role.hasAdmin(deployer)
			expect(hasAdmin).to.be.equal(true)
		})
	})
	describe('addOperator, removeOperator, hasOperator', () => {
		it('Permissions can be added or removed.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			let hasAdmin = await role.hasOperator(user1)
			expect(hasAdmin).to.be.equal(false)
			await role.addOperator(user1)
			hasAdmin = await role.hasOperator(user1)
			expect(hasAdmin).to.be.equal(true)
			await role.removeOperator(user1)
			hasAdmin = await role.hasOperator(user1)
			expect(hasAdmin).to.be.equal(false)
		})
		it('Only administrators can add permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			let result = await role
				.addOperator(user2, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have admin role')
			await role.addOperator(user1)
			result = await role
				.addOperator(user2, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have admin role')
		})
		it('Only administrators can remove permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			await role.addOperator(user1)
			const result = await role
				.removeOperator(user1, { from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have admin role')
		})
		it('Anyone can check to see if who has permissions.', async () => {
			const role = await artifacts.require('AdminAndOperatorRole').new()
			const hasAdmin = await role.hasOperator(deployer, { from: user1 })
			expect(hasAdmin).to.be.equal(false)
		})
	})
	describe('hasOperatingPrivilegesTest', () => {
		it('Admin has the operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			const isOperator = await role.hasOperatingPrivilegesTest(deployer)
			expect(isOperator).to.be.equal(true)
		})
		it('If user do not have operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			const isOperator = await role.hasOperatingPrivilegesTest(user1)
			expect(isOperator).to.be.equal(false)
		})
		it('Operator has the operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			await role.addOperator(user1)
			const isOperator = await role.hasOperatingPrivilegesTest(user1)
			expect(isOperator).to.be.equal(true)
		})
	})
	describe('onlyAdminAndOperatorTest', () => {
		it('Admin have the operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			const isOperator = await role.onlyAdminAndOperatorTest()
			expect(isOperator).to.be.equal(true)
		})
		it('If you do not have operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			const result = await role
				.onlyAdminAndOperatorTest({ from: user1 })
				.catch((err: Error) => err)
			validateErrorMessage(result, 'does not have operator role', false)
		})
		it('Operator has the operating privileges.', async () => {
			const role = await artifacts.require('AdminAndOperatorRoleTest').new()
			await role.addOperator(user1)
			const isOperator = await role.onlyAdminAndOperatorTest({
				from: user1,
			})
			expect(isOperator).to.be.equal(true)
		})
	})
})
