// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IAdminAndOperatorRole {
	function addAdmin(address _account) external;

	function removeAdmin(address _account) external;

	function hasAdmin(address _account) external view returns (bool);

	function addOperator(address _account) external;

	function removeOperator(address _account) external;

	function hasOperator(address _account) external view returns (bool);
}
