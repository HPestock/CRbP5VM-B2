program:
				0x258, 
				I_LD, T_LOC, T_NUM, 0xFFFF, 32, 
				
				I_LD, T_REG, T_NUM, R_R0, 0, 
				
				I_BIT, T_REG, R_R0, 0xFFFF, 0xFFFE, 
				I_CMP, T_LOC, T_NUM, 0xFFFE, 1, 
				I_BR, T_NE, T_LA, 0, T_NUM, 5, 
				I_LD, T_LOC, T_NUM, 0xFFFE, 255, 
				
				I_LD, T_LOC, T_NUM, 0xFFFC, 21, //a
				I_SUB, T_LOC, T_REG, 0xFFFC, R_R0, 
				I_SUB, T_LOC, T_REG, 0xFFFC, R_R0, 
				I_SUB, T_LOC, T_REG, 0xFFFC, R_R0, 
				I_LD, T_LOC, T_LOC, 0xFFFD, 0xFFFC, 
				I_ADD, T_LOC, T_NUM, 0xFFFD, 1, 
				I_SETVT, T_LOC, T_LOC, T_LOC, T_NUM, 0xFFFC, 0xFFFD, 0xFFFE, 1, 
				
				I_ADD, T_REG, T_NUM, R_R0, 1, 
				I_CMP, T_REG, T_NUM, R_R0, 8, 
				I_BR, T_LT, T_G, 0, T_NUM, 0x262, 
				I_RLV, 
				
				I_CIRQ, 0xFFFB, 
				I_CMP, T_LOC, T_NUM, 0xFFFB, 1, 
				I_BR, T_NE, T_LA, 0, T_NUM, 3, 
				I_RCD, 0, 0xFFFF, 
				
				I_ESC, 
				I_BR, T_NC, T_G, 0, T_NUM, 0x25D, 
				I_HALT
kernel:
				I_BR, T_NC, T_G, 0, T_REG, R_SYSRET