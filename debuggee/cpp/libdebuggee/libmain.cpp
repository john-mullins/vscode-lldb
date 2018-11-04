#include "debuggee.h"

extern "C"
#ifdef _MSC_VER
__declspec(dllexport)
#endif
void sharedlib_entry() {
    header_fn_sharedlib(3);
}
